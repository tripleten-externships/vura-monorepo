// stitches query resolvers together

import { getResources } from '../schema/queries/getResources';
import { userProfile } from '../schema/queries/userProfile';
import { getForumPosts } from '../schema/queries/getForumPosts';

export const Query = {
  userProfile,
  getResources,
  getForumPosts,
};
