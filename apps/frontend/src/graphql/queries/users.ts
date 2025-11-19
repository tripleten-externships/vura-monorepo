import { gql } from '../../__generated__/gql';

export const GET_USER_PROFILE = gql(`
  query GetUserProfile {
    userProfile {
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
`);
