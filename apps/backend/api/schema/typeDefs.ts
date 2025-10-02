import { gql } from 'graphql-tag';

// SDL for custom types/inputs/enums
export const typeDefs = gql`
  scalar DateTime

  input SignupInput {
    name: String!
    email: String!
    password: String!
    age: Int
    gender: String
    avatarUrl: String
  }

  type SignupResult {
    user: UserProfile!
    token: String!
  }

  type UserProfile {
    id: ID!
    name: String
    email: String
    avatarUrl: String
    age: Int
    gender: String
    privacyToggle: Boolean
    isAdmin: Boolean
    createdAt: DateTime
    lastLoginDate: DateTime
    lastUpdateDate: DateTime
  }

  type Mutation {
    signup(input: SignupInput!): SignupResult!
  }

  type Query {
    userProfile: UserProfile
  }
`;
