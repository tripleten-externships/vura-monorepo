import { graphql } from '@keystone-6/core';
import { ForumPost } from '../../../models';

async function logAuditEvent(
  context: any,
  eventType: 'POST_DELETED',
  userId: string,
  postId: string,
  details?: any
) {
  try {
    // this is what will return in the server terminal for now
    console.log('[AUDIT LOG]', {
      timestamp: new Date().toISOString(),
      eventType,
      userId,
      postId,
      details,
    });
    // to use when in production and we can connect to DB
    // await context.sudo().db.AuditLog.deleteOne({
    // // using sudo to always log this to the audit even if user doesn't have permission
    //     data:{
    //         eventType,
    //         user: {connect: {id: userId}},
    //         postId,
    //         timestamp: new Date(),
    //         details: details ? JSON.stringify(details) : null,
    //     },
    // });
  } catch (error) {
    console.log('[AUDIT LOG ERROR]', error);
  }
  // not using throw error, so post will still go through even if there is an audit logging error
}

export const deleteForumPost = {
  Mutation: {
    async deleteForumPost(_: any, { id }: { id: string }, context: any) {
      try {
        if (!context.session?.item) {
          throw new Error('User must be authenticated to delete forum posts');
        }

        const postId = id;

        const currentUserId = context.session.itemId;
        // Validation Section
        if (!postId) {
          throw new Error('Post ID is required');
        }
        if (!ForumPost) {
          throw new Error('Forum post not found');
        }
        const isAuthor = ForumPost.author?.id === currentUserId;
        const canDelete = isAuthor;
        if (!canDelete) {
          throw new Error('You can only delete your own forum posts');
        }

        let post;
        try {
          post = await context.db.forumPost.findOne({
            where: { id: postId },
          });
        } catch (error) {
          console.error('Database error:', error);
          throw new Error('Failed to delete forum post. Pleast try again later');
        }
        await logAuditEvent(context, 'POST_DELETED', context.session.itemId, post.id, {
          title: post.title,
          status: post.status,
        });
        return {
          post,
          message: 'Post deleted successfully',
        };
      } catch (error) {
        console.error('Delete post error:', error);
        throw new Error('Failed to delete post');
      }
    },
  },
};
