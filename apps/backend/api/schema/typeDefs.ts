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

  extend type Query {
    me: String
  }
`;
