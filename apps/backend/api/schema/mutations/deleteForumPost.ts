import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import { ForumService } from '../../../services/forum';
import { getEventBus } from '../../subscriptions/eventBus';

export const customDeleteForumPost = async (_: any, { id }: { id: string }, context: Context) => {
  try {
    if (!context.session?.data?.id) {
      throw new GraphQLError('User must be authenticated to delete forum posts', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const forumService = new ForumService({ context, eventBus: getEventBus() });
    return forumService.deletePost(id, context.session.data.id);
  } catch (error: any) {
    console.error('Delete post error:', error);
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError('Failed to delete forum post', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
