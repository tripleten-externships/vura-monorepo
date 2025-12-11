import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';

// delete logged-in user
export const customDeleteAccount = async (
  _: any,
  { email }: { email: string },
  context: Context
) => {
  try {
    const userId = context.session?.data?.id;

    if (!userId) {
      throw new GraphQLError('User must be authenticated to delete account', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    await context.db.User.deleteOne({ where: { id: userId } });

    return {
      success: true,
      message: 'User account deleted successfully',
    };
  } catch (error) {
    console.error('Delete account error:', error);
    throw new GraphQLError('Failed to delete user account', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
