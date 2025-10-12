// stitches query resolvers together
// import { someQuery } from '../schema/queries/someQuery';
import { Context } from '../../../backend/types/context';

export const Query = {
  // someQuery,
  _empty: () => null,
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
