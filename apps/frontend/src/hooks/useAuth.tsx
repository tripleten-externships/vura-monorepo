import { useCallback } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { USER_LOGIN, USER_LOGOUT } from '../graphql/mutations/users';
import { GET_USER_PROFILE } from '../graphql/queries/users';
import type {
  GetUserProfileQuery,
  AuthenticateUserWithPasswordMutation,
  AuthenticateUserWithPasswordMutationVariables,
  UserAuthenticationWithPasswordResult,
  UserAuthenticationWithPasswordSuccess,
  UserAuthenticationWithPasswordFailure,
} from '../__generated__/graphql';
import { client, setGraphqlHeaders } from '../store';

interface UseAuthProps {
  onLoginSuccess?: (data: { sessionId: string }) => void;
  onLogoutSuccess?: () => void;
}

const isSuccess = (
  auth: UserAuthenticationWithPasswordResult
): auth is UserAuthenticationWithPasswordSuccess =>
  auth.__typename === 'UserAuthenticationWithPasswordSuccess';

const isFailure = (
  auth: UserAuthenticationWithPasswordResult
): auth is UserAuthenticationWithPasswordFailure =>
  auth.__typename === 'UserAuthenticationWithPasswordFailure';

export const useAuth = ({ onLoginSuccess, onLogoutSuccess }: UseAuthProps) => {
  const [login, { error: loginError, loading: loginLoading }] = useMutation<
    AuthenticateUserWithPasswordMutation,
    AuthenticateUserWithPasswordMutationVariables
  >(USER_LOGIN);
  const {
    data: currentUserData,
    loading: currentUserLoading,
    error: currentUserError,
  } = useQuery<GetUserProfileQuery>(GET_USER_PROFILE);
  const [logout, { error: logoutError, loading: logoutLoading }] = useMutation(USER_LOGOUT);

  const handleLogin = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      const { data } = await login({
        variables: { email, password },
      });

      const auth = data?.authenticateUserWithPassword;
      if (!auth) {
        throw new Error('Authentication failed');
      }

      if (isFailure(auth)) {
        throw new Error(auth.message);
      }

      if (isSuccess(auth)) {
        await setGraphqlHeaders(auth.sessionToken);
        await client.refetchQueries({
          include: [GET_USER_PROFILE],
        });
        onLoginSuccess?.({ sessionId: auth.sessionToken });
      }
    },
    [login, onLoginSuccess]
  );

  const handleLogout = useCallback(async () => {
    try {
      const res = await logout();
      if (res) {
        await setGraphqlHeaders(undefined);
        await client.clearStore();
        onLogoutSuccess?.();
      }
    } catch (err) {
      console.error(err);
    }
  }, [logout, onLogoutSuccess]);

  return {
    currentUser: currentUserData?.userProfile ?? null,
    login: handleLogin,
    error: currentUserError ?? logoutError ?? loginError,
    logout: handleLogout,
    loading: currentUserLoading || loginLoading || logoutLoading,
  };
};
