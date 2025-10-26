import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import { logAuditEvent } from '../../../utils/logger';

export const customDeleteForumPost = async (_: any, { id }: { id: string }, context: Context) => {
  try {
    if (!context.session?.data?.id) {
      throw new GraphQLError('User must be authenticated to delete forum posts', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const postId = id;
    const currentUserId = context.session.data.id;

    // Validation Section
    if (!postId) {
      throw new GraphQLError('Post ID is required', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    // Find the post first
    let post;
    try {
      post = await context.db.ForumPost.findOne({
        where: { id: postId },
      });
    } catch (error) {
      console.error('Database error:', error);
      throw new GraphQLError('Failed to find forum post. Please try again later', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }

    if (!post) {
      throw new GraphQLError('Forum post not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check if the current user is the author
    if (post.authorId !== currentUserId) {
      throw new GraphQLError('You can only delete your own forum posts', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // Delete the post
    try {
      await context.db.ForumPost.deleteOne({
        where: { id: postId },
      });
    } catch (error) {
      console.error('Database error:', error);
      throw new GraphQLError('Failed to delete forum post. Please try again later', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }

    await logAuditEvent(context, 'POST_DELETED', currentUserId, postId, {
      title: post.title,
    });

    return {
      success: true,
      message: 'Post deleted successfully',
      deletedPostId: postId,
    };
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
