import { gql } from '@apollo/client';

export const UPDATE_PROFILE = gql(`
    mutation UpdateProfile($input: UpdateProfileInput!) {
      updateProfile(input: $input) {
        success
      message
      error
      userId
      }
    }
  `);
