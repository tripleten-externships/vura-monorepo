import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import { ForumService } from '../../../services/forum';
import { getEventBus } from '../../subscriptions/eventBus';
import { ListForumPostsInput } from '../../../services/forum/types';

export const getForumPosts = async (
  _: any,
  { input }: { input?: ListForumPostsInput },
  context: Context
) => {
  try {
    if (!context.session?.data?.id) {
      throw new GraphQLError('User must be authenticated to view forum posts', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const forumService = new ForumService({ context, eventBus: getEventBus() });
    return forumService.listPosts(input, context.session.data.id);
  } catch (error: any) {
    console.error('Error fetching forum posts:', error);
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError(error.message || 'Failed to fetch forum posts', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
