import { graphql } from '@keystone-6/core';
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

export const createForumPost = graphql.field({
  // type section aligns with Jira output schema
  type: graphql.nonNull(
    graphql.object()({
      //defining custom GraphQL mutation with nonNull making sure the mutation always returns an object
      name: 'Create Post Result', // creates a type with this title in the GraphQL API
      fields: {
        forumPost: graphql.field({
          type: graphql.nonNull(graphql.String),
          resolve: (source: any) => source.post,
        }),
        message: graphql.field({
          type: graphql.nonNull(graphql.String),
          resolve: (source: any) => source.message,
        }),
      },
    })
  ),
  // args section aligns with Jira input schema and defines what data the createForumPost mutation accepts
  args: {
    title: graphql.arg({ type: graphql.nonNull(graphql.String) }),
    topic: graphql.arg({ type: graphql.nonNull(graphql.String) }),
    content: graphql.arg({ type: graphql.nonNull(graphql.String) }),
  },
  async resolve(source: any, args: any, context: any) {
    try {
      if (!context.session?.itemId) {
        throw new Error('User must be authenticated to create forum posts');
      }

      // validation section aligns with Jira error handling instructions
      if (!args.title || args.title.trim() === '') {
        throw new Error('Title is required');
      }

      const sanitizedTitle = sanitizeContent(args.title);

      const MAX_TITLE_LENGTH = 30;
      if (args.title.length > MAX_TITLE_LENGTH) {
        throw new Error('Title must be 30 characters or less');
      }

      if (!args.topic || args.topic.trim() === '') {
        throw new Error('Topic is required');
      }
      const MAX_TOPIC_LENGTH = 50;
      if (args.topic.length > MAX_TOPIC_LENGTH) {
        throw new Error('Topic must be 50 characters or less');
      }

      if (!args.content || args.content.trim() === '') {
        throw new Error('Content is required');
      }
      const sanitizedContent = sanitizeContent(args.content);

      const MIN_CONTENT_LENGTH = 10;
      if (args.content.trim().length < MIN_CONTENT_LENGTH) {
        throw new Error('Content must be at least 10 characters long');
      }
      const MAX_CONTENT_LENGTH = 5000;
      if (args.content.length < MAX_CONTENT_LENGTH) {
        throw new Error('Content cannot be longer than 5,000 characters');
      }
      const post = await context.db.Post.createOne({
        date: {
          title: sanitizedTitle,
          content: sanitizedContent,
          author: { connect: { id: args.authorId } },
          publishedAt: args.publishedAt || new Date(),
          status: args.status || 'draft',
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
});

// import into api>resolvers>mutation or import into query depending on wht it is
