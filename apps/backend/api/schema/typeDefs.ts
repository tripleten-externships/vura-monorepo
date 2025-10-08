import { gql } from 'graphql-tag';
// SDL for custom types/inputs/enums
export const typeDefs = gql`
  scalar DateTime

  type Mutation {
    _empty: String
  }

  type Query {
    _empty: String
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

  extend type Query {
    userProfile: UserProfile
  }
`;
