// stitches query resolvers together
import { getResources } from '../schema/queries/getResources';
import { userProfile } from '../schema/queries/userProfile';
import { getForumPosts } from '../schema/queries/getForumPosts';
import { getUserCarePlan } from '../schema/queries/getUserCarePlan';


export const Query = {
  userProfile,
  getResources,
  getForumPosts,
  getUserCarePlan,
};
