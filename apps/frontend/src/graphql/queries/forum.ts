import { gql } from '../../__generated__/gql';

export const GET_FORUM_POSTS = gql(`
  query GetForumPosts($input: GetForumPostsInput) {
    getForumPosts(input: $input) {
      edges {
        cursor
        node {
          id
          title
          topic
          content
          createdAt
          updatedAt
          author {
            id
            name
            email
          }
        }
      }
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);
