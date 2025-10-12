import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type ForumPost {
    id: ID!
    title: String!
    topic: String
    content: String!
    author: String
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    getForumPost(id: ID!): ForumPost
  }

  type Mutation {
    createForumPost(title: String!, topic: String, content: String!, author: String): ForumPost
  }
`;

// typeDefs describe what types of data the API exposes and what operations are allowed
