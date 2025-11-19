import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import { forumNotificationService } from '../../../services/forum/forum.service';

// resolver function to unsubscribe from forum topic
export const customUnsubscribeFromForum = async (
  _: any,
  { topic }: { topic: string },
  context: Context
) => {
  try {
    // checks that the user is authenticated
    if (!context.session?.data?.id) {
      throw new GraphQLError('User must be authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }
    // unsubscribe the user from a forum topic
    const result = await forumNotificationService.createUnSubscription(
      context.session.data.id,
      topic,
      context
    );

    return {
      success: result,
      message: 'Unsubscribed successfully',
    };
  } catch (error: any) {
    console.error('Unsubscribe from forum mutation error:', error);
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError('Failed to unsubscribe from forum topic', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
