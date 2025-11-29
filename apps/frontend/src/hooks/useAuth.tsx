import { useCallback } from 'react';
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

  const handleLogin = useCallback(
    async (input: FrontendLoginInput) => {
      const { data } = await login({
        variables: { input },
      });

      await persistAuthPayload(data?.loginFrontendUser);
    },
    [login, persistAuthPayload]
  );

  const handleSignup = useCallback(
    async (input: FrontendSignupInput) => {
      const { data } = await signupMutation({
        variables: { input },
      });

      await persistAuthPayload(data?.registerFrontendUser);
    },
    [persistAuthPayload, signupMutation]
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
    }
  }, [logout, onLogoutSuccess]);

  const aggregatedError =
    currentUserError ?? logoutError ?? loginError ?? signupError ?? oauthError;

  return {
    currentUser: currentUserData?.userProfile ?? null,
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
