// stitches query resolvers together
// import { someQuery } from '../schema/queries/someQuery';
import { getForumPosts } from '../schema/queries/getForumPosts.ts';

export const Query = {
  // someQuery,
  getForumPosts,
  _empty: () => null,
};
