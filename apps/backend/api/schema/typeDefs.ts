import { gql } from 'graphql-tag';
// SDL for custom types/inputs/enums
export const typeDefs = gql`
  input GetForumPostsInput {
    first: Int
    after: String
    topic: String
    authorId: ID
    searchTerm: String
    dateFrom: DateTime
    dateTo: DateTime
    orderBy: ForumPostOrderBy
  }
  enum ForumPostOrderBy {
    CREATED_AT_ASC
    CREATED_AT_DESC
    UPDATED_AT_ASC
    UPDATED_AT_DESC
    TITLE_ASC
    TITLE_DESC
  }

  type ForumPostConnection {
    edges: [ForumPostEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ForumPostEdge {
    node: ForumPost!
    cursor: String!
  }
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }
  extend type Query {
    getForumPosts(input: GetForumPostsInput): ForumPostConnection!
  }
`;
