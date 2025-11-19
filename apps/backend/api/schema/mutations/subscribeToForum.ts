import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import { ForumService } from '../../../services/forum';
import { getEventBus } from '../../subscriptions/eventBus';

// resolver function to subscribe to forum topic
export const customSubscribeToForum = async (
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
    const forumService = new ForumService({ context, eventBus: getEventBus() });
    return forumService.subscribeToTopic({
      userId: context.session.data.id,
      authorName,
      postId,
      topic,
    });
  } catch (error: any) {
    console.error('Subscribe to forum mutation error:', error);
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError('Failed to subscribe to forum topic', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
