import { gql } from 'graphql-tag';

// SDL for custom types/inputs/enums
export const typeDefs = gql`
  extend type Mutation {
    # Make result nullable to allow returning structured errors without throwing
    updateProfile(input: UpdateProfileInput!): UpdateProfileResult
  }

  extend type Query {
    _empty: String
  }
  extend type Query {
    me: User
  }

  input UpdateProfileInput {
    name: String
    email: String
    age: Int
    gender: String
    avatarUrl: String
    currentPassword: String
  }

  type UpdateProfileResult {
    userId: ID
    user: User
    message: String
    error: String
  }
`;
