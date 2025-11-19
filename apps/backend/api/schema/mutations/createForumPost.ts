import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import { getWebSocketService } from '../../../services/websocket';
import { pubsub, SubscriptionTopics } from '../../subscriptions/pubsub';
import { logAuditEvent } from '../../../utils/logger';
import { sanitizeContent } from '../../../utils/sanitizeContent';
import { ForumPostCreatedEvent } from '../../subscriptions/events';
import { ForumPostPriority } from '../../../services/forum/types';
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
        topic: data.topic,
        content: sanitizedContent,
        priority: data.priority || 'MEDIUM',
        metadata: data.metadata || {},
        forumPostType: data.forumPostType,
        author: { connect: { id: context.session.data.id } },
      },
    });

    await logAuditEvent(context, 'POST_CREATED', context.session.data.id, String(post.id), {
      title: post.title,
    });

    const subscribers = await context.db.ForumSubscription.findMany({
      where: { topic: { equals: data.topic } },
    });

    const subscriberIds = subscribers.map((s) => s.userId as string);

    // Prepare event payload
    const eventPayload: ForumPostCreatedEvent = {
      userId: context.session.data.id,
      postId: post.id.toString(),
      topic: post.topic as string,
      title: post.title as string,
      createdAt: (post.createdAt as Date).toISOString(),
      subscriberIds,
      content: post.content as string,
      authorName: context.session.data.name,
    };

    /// Emit the forumPost via WebSockets
    try {
      const websocketService = getWebSocketService();
      websocketService.emitNewForumPost(eventPayload);
    } catch (wsError) {
      console.error('Failed to emit WebSocket event:', wsError);
    }

    // Publish the forumPost to GraphQL subscriptions
    try {
      pubsub.publish(SubscriptionTopics.FORUM_POST_CREATED, eventPayload);
    } catch (eventError) {
      console.error('Failed to publish forum post created event:', eventError);
    }

    return {
      forumPost: post,
      message: 'Post created successfully',
    };
  } catch (error: any) {
    console.error('Create post error:', error);

    // Re-throw GraphQL errors to preserve validation messages
    if (error instanceof GraphQLError) {
      throw error;
    }

    // Throw generic error for unexpected failures
    throw new GraphQLError('Failed to create post', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
