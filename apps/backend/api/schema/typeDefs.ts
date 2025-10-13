import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type ForumPost {
    id: ID!
    title: String!
    topic: String!
    content: String!
    author: String!
    createdAt: String!
    updatedAt: String!
  }

  input CreateForumPostInput {
    title: String!
    topic: String!
    content: String!
  }

  input DeleteForumPostInput {
    postId: ID!
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

  type Query {
    getForumPost(id: ID!): ForumPost
  }

  type Mutation {
    createForumPost(data: CreateForumPostInput!): CreateForumPostResult!
    deleteForumPost(id: ID!): DeleteForumPostResult!
  }
`;

// typeDefs describe what types of data the API exposes and what operations are allowed
