import { gql } from 'graphql-tag';

// SDL for custom types/inputs/enums
export const typeDefs = gql`
  scalar DateTime

  type Mutation {
    _empty: String
    updateProfile(input: UpdateProfileInput!): UpdateProfileResult!
  }

  type Query {
    _empty: String
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
    user: User!
    message: String!
  }
`;
