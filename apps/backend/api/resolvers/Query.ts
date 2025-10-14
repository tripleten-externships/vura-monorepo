// stitches query resolvers together
import { Context } from '../../../backend/types/context';
import { getResources } from '../schema/queries/getResources';
import { userProfile } from '../schema/queries/userProfile';
import { getForumPosts } from '../schema/queries/getForumPosts';

export const Query = {
  userProfile,
  getResources,
  getForumPosts,
  me: async (_: unknown, __: unknown, context: Context) => {
    const session = context.session;
    console.log('Session:', context.session);

    if (!session?.data?.id) return null;

    return await context.query.User.findOne({
      where: { id: session.data.id },
      query: 'id name email age gender avatarUrl',
    });
  },
};
