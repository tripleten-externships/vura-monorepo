import { GraphQLError } from 'graphql';
import { sanitizeContent } from '../../utils/sanitizeContent';
import { logger, logAuditEvent } from '../../utils/logger';
import { notificationService } from '../notification';
import { SubscriptionTopics } from '../../api/subscriptions/pubsub';
import { ForumPostCreatedEvent } from '../../api/subscriptions/events';
import {
  CreateForumPostInput,
  CreateSubscribeForum,
  ForumNotificationCreateData,
  ForumPostPriority,
  ListForumPostsInput,
} from './types';
import { BaseService, ServiceDependencies } from '../core';

const TITLE_MAX = 30;
const TOPIC_MAX = 50;
const CONTENT_MIN = 10;
const CONTENT_MAX = 5000;

export class ForumService extends BaseService {
  constructor(deps: ServiceDependencies) {
    super(deps);
  }

  /**
   * creates a forum post, persists it, and emits the fan-out event so subscribers/websockets
   * can react without the resolver carrying that burden.
   */
  async createPost(input: CreateForumPostInput, userId: string) {
    const title = input.title?.trim();
    const topic = input.topic?.trim();
    const content = input.content?.trim();

    if (!title) {
      throw new GraphQLError('title is required', { extensions: { code: 'BAD_USER_INPUT' } });
    }
    if (title.length > TITLE_MAX) {
      throw new GraphQLError(`title must be ${TITLE_MAX} characters or less`, {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    if (!topic) {
      throw new GraphQLError('topic is required', { extensions: { code: 'BAD_USER_INPUT' } });
    }
    if (topic.length > TOPIC_MAX) {
      throw new GraphQLError(`topic must be ${TOPIC_MAX} characters or less`, {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    if (!content) {
      throw new GraphQLError('content is required', { extensions: { code: 'BAD_USER_INPUT' } });
    }
    if (content.length < CONTENT_MIN) {
      throw new GraphQLError(`content must be at least ${CONTENT_MIN} characters long`, {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    if (content.length > CONTENT_MAX) {
      throw new GraphQLError(`content must be ${CONTENT_MAX} characters or less`, {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const sanitizedTitle = sanitizeContent(title);
    const sanitizedContent = sanitizeContent(content);

    const forumPost = await this.context.db.ForumPost.createOne({
      data: {
        title: sanitizedTitle,
        topic,
        content: sanitizedContent,
        priority: input.priority || ('MEDIUM' satisfies ForumPostPriority),
        metadata: input.metadata || {},
        forumPostType: input.forumPostType || 'NEW_POST',
        author: { connect: { id: userId } },
      },
    });

    await logAuditEvent(this.context, 'POST_CREATED', userId, String(forumPost.id), {
      title: forumPost.title,
    });

    const subscriberRecords = await this.context.db.ForumSubscription.findMany({
      where: { topic: { equals: topic } },
    });

    const subscriberIds = subscriberRecords
      .map((record) => record.userId)
      .filter((id): id is string => Boolean(id));

    const resolvedTitle =
      typeof forumPost.title === 'string' && forumPost.title.length > 0
        ? forumPost.title
        : sanitizedTitle;
    const resolvedTopic =
      typeof forumPost.topic === 'string' && forumPost.topic.length > 0 ? forumPost.topic : topic;
    const resolvedContent =
      typeof forumPost.content === 'string' && forumPost.content.length > 0
        ? forumPost.content
        : sanitizedContent;
    const createdAtValue =
      forumPost.createdAt instanceof Date
        ? forumPost.createdAt.toISOString()
        : forumPost.createdAt
          ? new Date(forumPost.createdAt as any).toISOString()
          : new Date().toISOString();

    const eventPayload: ForumPostCreatedEvent = {
      userId,
      postId: String(forumPost.id),
      topic: resolvedTopic,
      title: resolvedTitle,
      createdAt: createdAtValue,
      subscriberIds,
      content: resolvedContent,
      authorName:
        this.context.session?.data?.name || this.context.session?.data?.email || 'unknown author',
      forumPostType:
        (forumPost.forumPostType as ForumPostCreatedEvent['forumPostType']) || 'NEW_POST',
    };

    this.eventBus.publish(SubscriptionTopics.FORUM_POST_CREATED, eventPayload);

    return {
      forumPost,
      message: 'Post created successfully',
    };
  }

  /**
   * deletes a forum post after verifying ownership.
   */
  async deletePost(postId: string, userId: string) {
    if (!postId) {
      throw new GraphQLError('post id is required', { extensions: { code: 'BAD_USER_INPUT' } });
    }

    const post = await this.context.db.ForumPost.findOne({ where: { id: postId } });
    if (!post) {
      throw new GraphQLError('forum post not found', { extensions: { code: 'NOT_FOUND' } });
    }
    if (post.authorId !== userId) {
      throw new GraphQLError('you can only delete your own forum posts', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    await this.context.db.ForumPost.deleteOne({ where: { id: postId } });
    await logAuditEvent(this.context, 'POST_DELETED', userId, postId, { title: post.title });

    return {
      success: true,
      message: 'Post deleted successfully',
      deletedPostId: postId,
    };
  }

  /**
   * subscribes the user to a topic and returns the friendly notification payload used by graphql.
   */
  async subscribeToTopic(data: CreateSubscribeForum) {
    if (!data.userId) {
      throw new GraphQLError('user id is required', { extensions: { code: 'BAD_USER_INPUT' } });
    }
    const topic = data.topic?.trim();
    if (!topic) {
      throw new GraphQLError('topic is required', { extensions: { code: 'BAD_USER_INPUT' } });
    }

    const existing = await this.context.db.ForumSubscription.findMany({
      where: {
        user: { id: { equals: data.userId } },
        topic: { equals: topic },
      },
    });

    if (existing.length > 0) {
      throw new GraphQLError('already subscribed to this topic', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const subscription = await this.context.db.ForumSubscription.createOne({
      data: {
        user: { connect: { id: data.userId } },
        topic,
        content: `Subscribed to "${topic}"`,
        metadata: data.metadata || {},
      },
    });

    logger.info('forum subscription created', { userId: data.userId, topic });

    return {
      success: true,
      message: 'Subscribed successfully',
      subscriptionId: subscription.id,
      notification: {
        id: subscription.id,
        topic,
        content: subscription.content,
        actionUrl: `/community/${encodeURIComponent(topic)}`,
      },
    };
  }

  /**
   * removes the subscription for the given topic.
   */
  async unsubscribeFromTopic(userId: string, topic: string) {
    if (!userId) {
      throw new GraphQLError('user id is required', { extensions: { code: 'BAD_USER_INPUT' } });
    }
    if (!topic) {
      throw new GraphQLError('topic is required', { extensions: { code: 'BAD_USER_INPUT' } });
    }

    const subscriptions = await this.context.db.ForumSubscription.findMany({
      where: {
        topic: { equals: topic },
        user: { id: { equals: userId } },
      },
    });

    if (subscriptions.length === 0) {
      throw new GraphQLError('subscription not found', { extensions: { code: 'NOT_FOUND' } });
    }

    const subscriptionIds = subscriptions
      .map((subscription) => subscription.id)
      .filter((id): id is string => Boolean(id));

    if (subscriptionIds.length) {
      await this.context.db.ForumSubscription.deleteMany({
        where: subscriptionIds.map((id) => ({ id })),
      });
    }

    logger.info('forum subscription deleted', { userId, topic });

    return {
      success: true,
      message: 'Unsubscribed successfully',
      subscriptionId: subscriptionIds[0],
      notification: null,
    };
  }

  /**
   * used by the async event handler to fan out mention + regular notifications using the
   * primary notification service, so counters and subscriptions stay in sync.
   */
  async dispatchForumNotifications(event: ForumPostCreatedEvent) {
    const recipientIds = event.subscriberIds.filter((id) => id !== event.userId);
    if (recipientIds.length === 0) {
      logger.debug('no subscribers for forum topic', { postId: event.postId });
      return;
    }

    const mentionedRecipients = this.extractMentions(event.content).filter((mention) =>
      recipientIds.includes(mention)
    );
    const regularRecipients = recipientIds.filter((id) => !mentionedRecipients.includes(id));

    for (const userId of mentionedRecipients) {
      const notification = await this.createForumNotification(
        {
          userId,
          type: 'forum_mention',
          notificationType: 'FORUM',
          priority: 'HIGH',
          title: event.title,
          topic: event.topic,
          content: `${event.authorName} mentioned you in a post about ${event.topic}`,
          metadata: this.buildNotificationMetadata(event),
          relatedForumPostId: event.postId,
        },
        event
      );
      this.publishForumNotification(notification, event);
    }

    for (const userId of regularRecipients) {
      const notification = await this.createForumNotification(
        {
          userId,
          type: 'forum_post',
          notificationType: 'FORUM',
          priority: 'MEDIUM',
          title: event.title,
          topic: event.topic,
          content: `${event.authorName} created a new post in ${event.topic}`,
          metadata: this.buildNotificationMetadata(event),
          relatedForumPostId: event.postId,
        },
        event
      );
      this.publishForumNotification(notification, event);
    }

    logger.info('forum notifications processed', {
      postId: event.postId,
      mentions: mentionedRecipients.length,
      regular: regularRecipients.length,
    });
  }

  private extractMentions(message: string): string[] {
    const mentionRegex = /@([a-zA-Z0-9-_]+)/g;
    const mentions: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = mentionRegex.exec(message)) !== null) {
      mentions.push(match[1]);
    }
    return [...new Set(mentions)];
  }

  private buildNotificationMetadata(event: ForumPostCreatedEvent) {
    return {
      postId: event.postId,
      topic: event.topic,
      authorId: event.userId,
      authorName: event.authorName,
    };
  }

  private async createForumNotification(
    data: ForumNotificationCreateData,
    event: ForumPostCreatedEvent
  ) {
    if (!data.userId) {
      throw new GraphQLError('user id is required for notifications', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    return notificationService.createNotification(
      {
        userId: data.userId,
        type: data.type,
        notificationType: data.notificationType || 'FORUM',
        priority: data.priority || 'MEDIUM',
        content: data.content,
        actionUrl: `/community/${encodeURIComponent(event.topic)}`,
        metadata: data.metadata,
        relatedForumPostId: data.relatedForumPostId,
      },
      this.context
    );
  }

  private publishForumNotification(notification: any, event: ForumPostCreatedEvent) {
    this.eventBus.publish(SubscriptionTopics.FORUM_NOTIFICATION, {
      userId: notification.user?.id || notification.userId,
      notificationId: notification.id,
      type: notification.type,
      notificationType: notification.notificationType,
      priority: notification.priority,
      content: notification.content,
      actionUrl: notification.actionUrl,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
      postId: event.postId,
      topic: event.topic,
      subscriberIds: event.subscriberIds,
      authorName: event.authorName,
    });
  }

  /**
   * fetches forum posts with pagination + filtering mirroring the original resolver behavior.
   */
  async listPosts(input: ListForumPostsInput = {}, userId: string) {
    if (!userId) {
      throw new GraphQLError('user must be authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const {
      first = 10,
      after,
      topic,
      authorId,
      searchTerm,
      dateFrom,
      dateTo,
      orderBy = 'CREATED_AT_DESC',
    } = input;

    if (first <= 0 || first > 50) {
      throw new GraphQLError('invalid pagination parameters', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
      throw new GraphQLError('invalid date range', { extensions: { code: 'BAD_USER_INPUT' } });
    }

    if (searchTerm && searchTerm.length < 3) {
      throw new GraphQLError('search term must be at least 3 characters', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    if (authorId) {
      const authorExists = await this.context.db.User.findOne({ where: { id: authorId } });
      if (!authorExists) {
        throw new GraphQLError('author not found', { extensions: { code: 'BAD_USER_INPUT' } });
      }
    }

    let cursorId: string | undefined;
    if (after) {
      try {
        cursorId = Buffer.from(after, 'base64').toString('utf-8');
      } catch {
        throw new GraphQLError('invalid cursor', { extensions: { code: 'BAD_USER_INPUT' } });
      }
    }

    const filters: any = {};
    if (topic) filters.topic = { equals: topic };
    if (authorId) filters.author = { id: { equals: authorId } };
    if (searchTerm) {
      filters.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    if (dateFrom || dateTo) {
      filters.createdAt = {};
      if (dateFrom) filters.createdAt.gte = dateFrom;
      if (dateTo) filters.createdAt.lte = dateTo;
    }

    const [field, direction = 'DESC'] = orderBy.split('_');
    const posts = await this.context.db.ForumPost.findMany({
      where: filters,
      take: first,
      skip: after ? 1 : 0,
      ...(cursorId && { cursor: { id: cursorId } }),
      orderBy: { [field.toLowerCase()]: direction.toLowerCase() === 'asc' ? 'asc' : 'desc' },
    });

    const totalCount = await this.context.db.ForumPost.count({ where: filters });

    const edges = posts.map((post: any) => ({
      node: post,
      cursor: Buffer.from(post.id).toString('base64'),
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage: posts.length === first,
        hasPreviousPage: !!after,
        startCursor: edges.length ? edges[0].cursor : null,
        endCursor: edges.length ? edges[edges.length - 1].cursor : null,
      },
      totalCount,
    };
  }
}
