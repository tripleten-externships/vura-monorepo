import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import { forumNotificationService } from '../../../services/forum/forum.service';

// resolver function to subscribeFromForum
export const customSubscribToForum = async (
  _: any,
  { authorName, topic, postId }: { authorName: string; topic: string; postId: string },
  context: Context
) => {
  try {
    // checks that the user is authenticated
    if (!context.session?.data?.id) {
      throw new GraphQLError('User must be authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }
    // subscribe the user from a forum topic
    const notification = await forumNotificationService.createSubscription(
      {
        userId: context.session.data.id,
        type: 'FORUM',
        authorName,
        postId,
        topic,
        content: `Subscribed to "${topic}"`,
        actionUrl: postId ? `/forum/${postId}` : `/forum/topics/${topic}`,
      },
      context
    );

    return {
      notification,
      message: 'subcribed successfully',
    };
  } catch (error: any) {
    console.error('subcribedforumpost mutation error:', error);
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError('Failed to subscribed', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
