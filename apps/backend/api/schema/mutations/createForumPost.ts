import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import { logAuditEvent } from '../../../utils/logger';
import { sanitizeContent } from '../../../utils/sanitizeContent';

// custom input type
export interface CreateForumPostInput {
  title: string;
  topic: string;
  content: string;
}

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

    const { title, topic, content } = data;

    // validation section aligns with Jira error handling instructions
    if (!title || title.trim() === '') {
      throw new GraphQLError('Title is required', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const sanitizedTitle = sanitizeContent(title);

    const MAX_TITLE_LENGTH = 30;
    if (title.length > MAX_TITLE_LENGTH) {
      throw new GraphQLError('Title must be 30 characters or less', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    if (!topic || topic.trim() === '') {
      throw new GraphQLError('Topic is required', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    const MAX_TOPIC_LENGTH = 50;
    if (topic.length > MAX_TOPIC_LENGTH) {
      throw new GraphQLError('Topic must be 50 characters or less', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    if (!content || content.trim() === '') {
      throw new GraphQLError('Content is required', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    const sanitizedContent = sanitizeContent(content);

    const MIN_CONTENT_LENGTH = 10;
    if (content.trim().length < MIN_CONTENT_LENGTH) {
      throw new GraphQLError('Content must be at least 10 characters long', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    const MAX_CONTENT_LENGTH = 5000;
    if (content.length > MAX_CONTENT_LENGTH) {
      throw new GraphQLError('Content cannot be longer than 5,000 characters', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const post = await context.db.ForumPost.createOne({
      data: {
        title: sanitizedTitle,
        topic: topic,
        content: sanitizedContent,
        author: { connect: { id: context.session.data.id } },
      },
    });

    await logAuditEvent(context, 'POST_CREATED', context.session.data.id, String(post.id), {
      title: post.title,
    });

    return {
      forumPost: post,
      message: 'Post created successfully',
    };
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
