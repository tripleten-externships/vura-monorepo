// stitches query resolvers together
import { getResources } from '../schema/queries/getResources';
import { userProfile } from '../schema/queries/userProfile';
import { getForumPosts } from '../schema/queries/getForumPosts';
import { customGetNotifications } from '../schema/queries/getNotifications';
import { customGetUnreadCount } from '../schema/queries/getUnreadCount';

export const Query = {
  userProfile,
  getResources,
  getForumPosts,
  customGetNotifications,
  customGetUnreadCount,
};
