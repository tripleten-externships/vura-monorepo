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

  input LoginInput {
    email: String!
    password: String!
  }

  type SignupResult {
    user: UserProfile!
    token: String!
  }

  type LoginResult {
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

  input GetResourcesInput {
    first: Int
    after: String
    checklistId: ID
    searchTerm: String
    orderBy: ResourceOrderBy
  }

  enum ResourceOrderBy {
    ID_ASC
    ID_DESC
    CONTENT_ASC
    CONTENT_DESC
  }

  type ResourceConnection {
    edges: [ResourceEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ResourceEdge {
    node: Resource!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type Mutation {
    signup(input: SignupInput!): SignupResult!
    login(input: LoginInput!): LoginResult!
  }

  type Query {
    userProfile: UserProfile
    getResources(input: GetResourcesInput): ResourceConnection!
  }

  type Resource {
    id: ID!
    link: String!
    content: String!
    checklist: Checklist
  }

  type Checklist {
    id: ID!
    name: String!
  }
`;
