import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import { notificationService } from '../../../services/notification';

export const customUnSubscribToForum = async (
  _: any,
  { topic }: { topic: string },
  context: Context
) => {
  try {
    if (!context.session?.data?.id) {
      throw new GraphQLError('User must be authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const result = await notificationService.createUnSubscription(
      context.session.data.id,
      topic,
      context
    );

    return {
      success: result,
      message: 'Unsubscribed successfully',
    };
  } catch (error: any) {
    console.error('UnSubcribedforumpost mutation error:', error);
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError('Failed to unsubscribed', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
