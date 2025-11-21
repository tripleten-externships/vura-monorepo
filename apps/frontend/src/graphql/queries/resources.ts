import { gql } from '../../__generated__/gql';

export const GET_RESOURCES = gql(`
  query GetResources($input: GetResourcesInput) {
    getResources(input: $input) {
      edges {
        cursor
        node {
          id
          content
          link
          checklist {
            id
            name
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`);
