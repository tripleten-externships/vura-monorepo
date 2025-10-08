import { gql } from 'graphql-tag';
// SDL for custom types/inputs/enums

export const typeDefs = gql`
  scalar DateTime

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
    _empty: String
  }

  type Query {
    _empty: String
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
    # add other fields as needed
  }

  input SuggestResourcesInput {
    carePlanId: ID
    checklistId: ID
    specificNeeds: String
    suggestionType: ResourceSuggestionType
    maxSuggestions: Int
    saveToDatabase: Boolean
  }

  enum ResourceSuggestionType {
    GENERAL
    CARE_PLAN_SPECIFIC
    EMERGENCY
    EDUCATIONAL
    SUPPORT_GROUPS
  }
`;
