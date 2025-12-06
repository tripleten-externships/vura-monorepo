import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import { UserProfileService } from '../../../services/user';
import { getEventBus } from '../../subscriptions/eventBus';

export const customDeleteAccount = async (_: any, { name }: { name: string }, context: Context) => {
  try {
    if (!context.session?.data?.id) {
      throw new GraphQLError('User must be authenticated to delete account', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const userService = new UserProfileService({ context, eventBus: getEventBus() });

    const success = await userService.deleteUser(name);

    if (!success) {
      throw new GraphQLError('Failed to delete user account', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }

    return {
      success: true,
      message: 'User account deleted successfully',
    };
  } catch (error: any) {
    console.error('Delete account error:', error);
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError('Failed to delete user account', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
