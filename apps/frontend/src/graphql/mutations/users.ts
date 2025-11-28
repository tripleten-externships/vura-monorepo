import { gql } from '../../__generated__/gql';

export const USER_LOGIN = gql(`
  mutation LoginFrontendUser($input: FrontendLoginInput!) {
    loginFrontendUser(input: $input) {
      token
      jwt
      user {
        id
        name
        email
        avatarUrl
        isAdmin
        privacyToggle
        createdAt
        lastLoginDate
        lastUpdateDate
      }
    }
  }
`);

export const USER_SIGNUP = gql(`
  mutation RegisterFrontendUser($input: FrontendSignupInput!) {
    registerFrontendUser(input: $input) {
      token
      jwt
      user {
        id
        name
        email
        avatarUrl
        isAdmin
        privacyToggle
        createdAt
        lastLoginDate
        lastUpdateDate
      }
    }
  }
`);

export const BEGIN_GOOGLE_AUTH = gql(`
  mutation BeginGoogleAuth {
    beginGoogleAuth {
      url
    }
  }
`);

export const BEGIN_APPLE_AUTH = gql(`
  mutation BeginAppleAuth {
    beginAppleAuth {
      url
    }
  }
`);

export const COMPLETE_OAUTH_LOGIN = gql(`
  mutation CompleteOAuthCallback($input: CompleteOAuthInput!) {
    completeOAuthCallback(input: $input) {
      token
      jwt
      user {
        id
        name
        email
        avatarUrl
        isAdmin
        privacyToggle
        createdAt
        lastLoginDate
        lastUpdateDate
      }
    }
  }
`);

export const USER_LOGOUT = gql(`
  mutation Mutation {
    endSession
  }
`);
