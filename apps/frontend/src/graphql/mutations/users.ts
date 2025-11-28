import { gql } from '../../__generated__/gql';

export const USER_LOGIN = gql(`
  mutation AuthenticateUserWithPassword($email: String!, $password: String!) {
    authenticateUserWithPassword(email: $email, password: $password) {
      ... on UserAuthenticationWithPasswordSuccess {
        sessionToken
        item {
          id
          name
          email
          avatarUrl
          isAdmin
          privacyToggle
        }
      }
      ... on UserAuthenticationWithPasswordFailure {
        message
      }
    }
  }
`);

export const USER_LOGOUT = gql(`
  mutation Mutation {
    endSession
  }
`);
