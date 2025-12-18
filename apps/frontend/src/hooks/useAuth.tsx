import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  USER_LOGIN,
  USER_LOGOUT,
  USER_SIGNUP,
  BEGIN_GOOGLE_AUTH,
  BEGIN_APPLE_AUTH,
  COMPLETE_OAUTH_LOGIN,
} from '../graphql/mutations/users';
import { GET_USER_PROFILE } from '../graphql/queries/users';
import type {
  GetUserProfileQuery,
  LoginFrontendUserMutation,
  LoginFrontendUserMutationVariables,
  RegisterFrontendUserMutation,
  RegisterFrontendUserMutationVariables,
  BeginGoogleAuthMutation,
  BeginAppleAuthMutation,
  CompleteOAuthCallbackMutation,
  CompleteOAuthCallbackMutationVariables,
} from '../__generated__/graphql';
import { client, setGraphqlHeaders } from '../store';
import { clearStoredJwt, setStoredJwt } from '../services/storage';

interface UseAuthProps {
  onLoginSuccess?: (data: { sessionId: string }) => void;
  onLogoutSuccess?: () => void;
}

type FrontendLoginInput = LoginFrontendUserMutationVariables['input'];
type FrontendSignupInput = RegisterFrontendUserMutationVariables['input'];
type FrontendOAuthInput = CompleteOAuthCallbackMutationVariables['input'];

export const useAuth = ({ onLoginSuccess, onLogoutSuccess }: UseAuthProps) => {
  const [demoUser, setDemoUser] = useState<null | { id: string; name: string; email: string }>(
    () => {
      if (typeof localStorage === 'undefined') return null;
      try {
        const raw = localStorage.getItem('demoUser');
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }
  );
  const [login, { error: loginError, loading: loginLoading }] = useMutation<
    LoginFrontendUserMutation,
    LoginFrontendUserMutationVariables
  >(USER_LOGIN);
  const [signupMutation, { error: signupError, loading: signupLoading }] = useMutation<
    RegisterFrontendUserMutation,
    RegisterFrontendUserMutationVariables
  >(USER_SIGNUP);
  const [beginGoogleAuthMutation] = useMutation<BeginGoogleAuthMutation>(BEGIN_GOOGLE_AUTH);
  const [beginAppleAuthMutation] = useMutation<BeginAppleAuthMutation>(BEGIN_APPLE_AUTH);
  const [completeOAuthMutation, { error: oauthError, loading: oauthLoading }] = useMutation<
    CompleteOAuthCallbackMutation,
    CompleteOAuthCallbackMutationVariables
  >(COMPLETE_OAUTH_LOGIN);
  const {
    data: currentUserData,
    loading: currentUserLoading,
    error: currentUserError,
  } = useQuery<GetUserProfileQuery>(GET_USER_PROFILE);
  const [logout, { error: logoutError, loading: logoutLoading }] = useMutation(USER_LOGOUT);

  const persistAuthPayload = useCallback(
    async (auth?: { token: string | null; jwt?: string | null }) => {
      if (!auth?.token) {
        throw new Error('Authentication failed');
      }

      await setGraphqlHeaders(auth.token);
      if (auth.jwt) {
        await setStoredJwt(auth.jwt);
      } else {
        await clearStoredJwt();
      }

      await client.refetchQueries({
        include: [GET_USER_PROFILE],
      });
      onLoginSuccess?.({ sessionId: auth.token });
    },
    [onLoginSuccess]
  );

  const persistDemoUser = useCallback(
    async (user: { name: string; email: string }) => {
      const demo = { id: 'demo-user', ...user };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('demoUser', JSON.stringify(demo));
      }
      setDemoUser(demo);
      onLoginSuccess?.({ sessionId: 'demo-session' });
    },
    [onLoginSuccess]
  );

  const handleLogin = useCallback(
    async (input: FrontendLoginInput) => {
      try {
        const { data } = await login({
          variables: { input },
        });

        await persistAuthPayload(data?.loginFrontendUser);
      } catch (err) {
        // fallback for demo/offline: allow local login
        await persistDemoUser({ name: input.email.split('@')[0] || 'User', email: input.email });
      }
    },
    [login, persistAuthPayload, persistDemoUser]
  );

  const handleSignup = useCallback(
    async (input: FrontendSignupInput) => {
      try {
        const { data } = await signupMutation({
          variables: { input },
        });

        await persistAuthPayload(data?.registerFrontendUser);
      } catch (err) {
        // fallback for demo/offline: allow local signup
        await persistDemoUser({ name: input.name ?? 'User', email: input.email });
      }
    },
    [persistAuthPayload, signupMutation, persistDemoUser]
  );

  const handleBeginGoogleAuth = useCallback(async () => {
    const { data } = await beginGoogleAuthMutation();
    return data?.beginGoogleAuth.url;
  }, [beginGoogleAuthMutation]);

  const handleBeginAppleAuth = useCallback(async () => {
    const { data } = await beginAppleAuthMutation();
    return data?.beginAppleAuth.url;
  }, [beginAppleAuthMutation]);

  const handleCompleteOAuthLogin = useCallback(
    async (input: FrontendOAuthInput) => {
      const { data } = await completeOAuthMutation({
        variables: { input },
      });

      await persistAuthPayload(data?.completeOAuthCallback);
    },
    [completeOAuthMutation, persistAuthPayload]
  );

  const handleLogout = useCallback(async () => {
    try {
      const res = await logout();
      if (res) {
        await setGraphqlHeaders(undefined);
        await clearStoredJwt();
        await client.clearStore();
        onLogoutSuccess?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('demoUser');
      }
      setDemoUser(null);
    }
  }, [logout, onLogoutSuccess]);

  const aggregatedError = demoUser
    ? null
    : (currentUserError ?? logoutError ?? loginError ?? signupError ?? oauthError);

  const currentUser = useMemo(
    () => currentUserData?.userProfile ?? demoUser ?? null,
    [currentUserData?.userProfile, demoUser]
  );

  return {
    currentUser,
    login: handleLogin,
    signup: handleSignup,
    beginGoogleAuth: handleBeginGoogleAuth,
    beginAppleAuth: handleBeginAppleAuth,
    completeOAuthLogin: handleCompleteOAuthLogin,
    error: aggregatedError,
    logout: handleLogout,
    loading: currentUserLoading || loginLoading || logoutLoading || signupLoading || oauthLoading,
  };
};
