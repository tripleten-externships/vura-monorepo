import { gql } from 'graphql-tag';

// SDL for custom types/inputs/enums

export const typeDefs = gql`
  scalar DateTime

  # Auth Inputs
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

  # Forum Post Inputs
  input CreateForumPostInput {
    title: String!
    topic: String!
    content: String!
  }

  input DeleteForumPostInput {
    postId: ID!
  }

  # Resource Inputs
  input GetResourcesInput {
    first: Int
    after: String
    checklistId: ID
    searchTerm: String
    orderBy: ResourceOrderBy
  }

  # Enums
  enum ResourceOrderBy {
    ID_ASC
    ID_DESC
    CONTENT_ASC
    CONTENT_DESC
  }

  # Auth Results
  type SignupResult {
    user: UserProfile!
    token: String!
  }

  type LoginResult {
    user: UserProfile!
    token: String!
  }

  # User Types
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

  # Forum Post Types
  type ForumPost {
    id: ID!
    title: String!
    topic: String!
    content: String!
    author: String!
    createdAt: String!
    updatedAt: String!
  }

  type CreateForumPostResult {
    forumPost: ForumPost!
    message: String!
  }

  type DeleteForumPostResult {
    success: Boolean!
    message: String!
    deletedPostId: ID
  }

  # Resource Types
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

  # Queries
  type Query {
    userProfile: UserProfile
    getResources(input: GetResourcesInput): ResourceConnection!
    getForumPost(id: ID!): ForumPost
  }

  # Mutations
  type Mutation {
    signup(input: SignupInput!): SignupResult!
    login(input: LoginInput!): LoginResult!
    createForumPost(data: CreateForumPostInput!): CreateForumPostResult!
    deleteForumPost(id: ID!): DeleteForumPostResult!
  }
`;

// typeDefs describe what types of data the API exposes and what operations are allowed
