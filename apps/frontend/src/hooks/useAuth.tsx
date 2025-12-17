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
import { client, setGraphqlHeaders } from '../store';
import { clearStoredJwt, setStoredJwt } from '../services/storage';

type AuthPayload = {
  token: string | null;
  jwt?: string | null;
};

type LoginResponse = {
  loginFrontendUser: AuthPayload;
};

type SignupResponse = {
  registerFrontendUser: AuthPayload;
};

type BeginGoogleAuthResponse = {
  beginGoogleAuth: {
    url: string;
  };
};

type BeginAppleAuthResponse = {
  beginAppleAuth: {
    url: string;
  };
};

type CompleteOAuthResponse = {
  completeOAuthCallback: AuthPayload;
};

type UserProfileResponse = {
  userProfile: any;
};

type LoginInput = {
  email: string;
  password: string;
};

type SignupInput = {
  email: string;
  password: string;
  name?: string;
};

type OAuthInput = {
  code: string;
  state?: string;
};

interface UseAuthProps {
  onLoginSuccess?: (data: { sessionId: string }) => void;
  onLogoutSuccess?: () => void;
}

export const useAuth = ({ onLoginSuccess, onLogoutSuccess }: UseAuthProps) => {
  const [loginMutation, { error: loginError, loading: loginLoading }] = useMutation<
    LoginResponse,
    { input: LoginInput }
  >(USER_LOGIN);

  const [signupMutation, { error: signupError, loading: signupLoading }] = useMutation<
    SignupResponse,
    { input: SignupInput }
  >(USER_SIGNUP);

  const [beginGoogleAuthMutation] = useMutation<BeginGoogleAuthResponse>(BEGIN_GOOGLE_AUTH);

  const [beginAppleAuthMutation] = useMutation<BeginAppleAuthResponse>(BEGIN_APPLE_AUTH);

  const [completeOAuthMutation, { error: oauthError, loading: oauthLoading }] = useMutation<
    CompleteOAuthResponse,
    { input: OAuthInput }
  >(COMPLETE_OAUTH_LOGIN);

  const [logoutMutation, { error: logoutError, loading: logoutLoading }] = useMutation(USER_LOGOUT);

  const {
    data: currentUserData,
    loading: currentUserLoading,
    error: currentUserError,
  } = useQuery<UserProfileResponse>(GET_USER_PROFILE);

  const persistAuthPayload = useCallback(
    async (auth?: AuthPayload) => {
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

  const login = useCallback(
    async (input: LoginInput) => {
      const { data } = await loginMutation({
        variables: { input },
      });

      await persistAuthPayload(data?.loginFrontendUser);
    },
    [loginMutation, persistAuthPayload]
  );

  const signup = useCallback(
    async (input: SignupInput) => {
      const { data } = await signupMutation({
        variables: { input },
      });

      await persistAuthPayload(data?.registerFrontendUser);
    },
    [signupMutation, persistAuthPayload]
  );

  const beginGoogleAuth = useCallback(async () => {
    const { data } = await beginGoogleAuthMutation();
    return data?.beginGoogleAuth.url;
  }, [beginGoogleAuthMutation]);

  const beginAppleAuth = useCallback(async () => {
    const { data } = await beginAppleAuthMutation();
    return data?.beginAppleAuth.url;
  }, [beginAppleAuthMutation]);

  const completeOAuthLogin = useCallback(
    async (input: OAuthInput) => {
      const { data } = await completeOAuthMutation({
        variables: { input },
      });

      await persistAuthPayload(data?.completeOAuthCallback);
    },
    [completeOAuthMutation, persistAuthPayload]
  );

  const logout = useCallback(async () => {
    try {
      const res = await logoutMutation();
      if (res) {
        await setGraphqlHeaders(undefined);
        await clearStoredJwt();
        await client.clearStore();
        onLogoutSuccess?.();
      }
    } catch (err) {
      console.error(err);
    }
  }, [logoutMutation, onLogoutSuccess]);

  const error = currentUserError ?? loginError ?? signupError ?? logoutError ?? oauthError;

  const loading =
    currentUserLoading || loginLoading || signupLoading || logoutLoading || oauthLoading;

  return {
    currentUser: currentUserData?.userProfile ?? null,
    login,
    signup,
    beginGoogleAuth,
    beginAppleAuth,
    completeOAuthLogin,
    logout,
    loading,
    error,
  };
};
