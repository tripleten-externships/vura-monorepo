import { graphql } from '@keystone-6/core';
import { ForumPost } from '../../../models';
// import { ForumPost } from '../../../models';

//helps make potentially dangerous content safe
function sanitizeContent(content: string): string {
  if (!content) return '';

  // Remove any HTML tags to prevent XSS
  const sanitized = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/<embed\b[^>]*>/gi, '') // Remove embed tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, ''); // Remove object tags

  return sanitized.trim();
}

async function logAuditEvent(
  context: any,
  eventType: 'POST_CREATED',
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
    // await context.sudo().db.AuditLog.createOne({
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

export const createForumPost = {
  // resolver for mutation
  Mutation: {
    async createForumPost(_: any, { data }: any, context: any) {
      try {
        if (!context.session?.itemId) {
          throw new Error('User must be authenticated to create forum posts');
        }

        const { title, topic, content, publishedAt, status } = data;

        // validation section aligns with Jira error handling instructions
        if (!title || title.trim() === '') {
          throw new Error('Title is required');
        }

        const sanitizedTitle = sanitizeContent(title);

        const MAX_TITLE_LENGTH = 30;
        if (title.length > MAX_TITLE_LENGTH) {
          throw new Error('Title must be 30 characters or less');
        }

        if (!topic || topic.trim() === '') {
          throw new Error('Topic is required');
        }
        const MAX_TOPIC_LENGTH = 50;
        if (topic.length > MAX_TOPIC_LENGTH) {
          throw new Error('Topic must be 50 characters or less');
        }

        if (!content || content.trim() === '') {
          throw new Error('Content is required');
        }
        const sanitizedContent = sanitizeContent(content);

        const MIN_CONTENT_LENGTH = 10;
        if (content.trim().length < MIN_CONTENT_LENGTH) {
          throw new Error('Content must be at least 10 characters long');
        }
        const MAX_CONTENT_LENGTH = 5000;
        if (content.length < MAX_CONTENT_LENGTH) {
          throw new Error('Content cannot be longer than 5,000 characters');
        }
        const post = await context.db.Post.createOne({
          date: {
            title: sanitizedTitle,
            content: sanitizedContent,
            author: { connect: { id: context.session.itemId } },
            publishedAt: publishedAt || new Date(),
            status: status || 'draft',
          },
        });
        await logAuditEvent(context, 'POST_CREATED', context.session.itemId, post.id, {
          title: post.title,
          status: post.status,
        });
        return {
          post,
          message: 'Post created successfully',
        };
      } catch (error) {
        console.error('Create post error:', error);
        throw new Error('Failed to create post');
      }
    },
  },
};
