import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import { ForumService } from '../../../services/forum';
import { getEventBus } from '../../subscriptions/eventBus';
import { CreateForumPostInput } from '../../../services/forum/types';

export const customCreateForumPost = async (
  _: any,
  { data }: { data: CreateForumPostInput },
  context: Context
) => {
  try {
    if (!context.session?.data?.id) {
      throw new GraphQLError('User must be authenticated to create forum posts', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const forumService = new ForumService({ context, eventBus: getEventBus() });
    return forumService.createPost(data, context.session.data.id);
  } catch (error: any) {
    console.error('Create post error:', error);

    if (error instanceof GraphQLError) {
      throw error;
    }

    throw new GraphQLError('Failed to create post', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
