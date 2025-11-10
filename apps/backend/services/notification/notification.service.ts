import { GraphQLError } from 'graphql';
import { Context } from '../../types/context';
import {
  CreateNotificationInput,
  CreateBulkNotificationsInput,
  NotificationFilters,
  PaginatedNotificationsResponse,
  INotificationService,
  NotificationType,
} from './types';
import { logger } from '../../utils/logger';
import { getRedisClient, getUnreadKey } from '../cache/redis';
import { pubsub, SubscriptionTopics } from '../../api/subscriptions/pubsub';

export class NotificationService implements INotificationService {
  /**
   * create and persist a single notification
   */
  async createNotification(data: CreateNotificationInput, context: Context): Promise<any> {
    try {
      // validate required fields
      if (!data.userId) {
        throw new GraphQLError('User ID is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (!data.notificationType) {
        throw new GraphQLError('Notification type category is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (!data.type || data.type.trim() === '') {
        throw new GraphQLError('Notification sub-type is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (!data.content || data.content.trim() === '') {
        throw new GraphQLError('Notification content is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // prepare notification data
      const notificationData: any = {
        type: data.type,
        notificationType: data.notificationType,
        priority: data.priority || 'MEDIUM',
        content: data.content,
        user: { connect: { id: data.userId } },
      };

      // add optional fields
      if (data.actionUrl) {
        notificationData.actionUrl = data.actionUrl;
      }

      if (data.metadata) {
        notificationData.metadata = data.metadata;
      }

      if (data.expiresAt) {
        notificationData.expiresAt = data.expiresAt;
      }

      if (data.scheduledFor) {
        notificationData.scheduledFor = data.scheduledFor;
      }

      // add relationships if provided
      if (data.relatedCarePlanId) {
        notificationData.relatedCarePlan = {
          connect: { id: data.relatedCarePlanId },
        };
      }

      if (data.relatedChatId) {
        notificationData.relatedChat = { connect: { id: data.relatedChatId } };
      }

      if (data.relatedForumPostId) {
        notificationData.relatedForumPost = {
          connect: { id: data.relatedForumPostId },
        };
      }

      // create notification
      const notification = await context.db.Notification.createOne({
        data: notificationData,
      });

      // log notification creation
      logger.info('Notification created', {
        notificationId: notification.id,
        userId: data.userId,
        type: data.type,
        notificationType: data.notificationType,
      });

      // increment unread counters in Redis and publish events
      try {
        const redis = getRedisClient();
        const key = getUnreadKey(data.userId);
        const results = await redis
          .multi()
          .hincrby(key, 'total', 1)
          .hincrby(key, String(notification.notificationType), 1)
          .exec();
        const newTotal =
          Array.isArray(results) && results[0] && results[0][1] != null
            ? Number(results[0][1])
            : undefined;

        // publish unread count changed (single total count)
        if (newTotal != null) {
          pubsub.publish(SubscriptionTopics.UNREAD_COUNT_CHANGED, {
            userId: data.userId,
            count: newTotal,
          });
        }

        // publish notification created
        pubsub.publish(SubscriptionTopics.NOTIFICATION_CREATED, {
          userId: data.userId,
          notificationId: notification.id,
          type: notification.type,
          notificationType: notification.notificationType,
          priority: notification.priority,
          content: notification.content,
          actionUrl: notification.actionUrl,
          metadata: notification.metadata,
          createdAt: notification.createdAt,
        });
      } catch (e) {
        console.error('Redis increment/publish failed after createNotification:', e);
      }

      return notification;
    } catch (error: any) {
      console.error('Create notification error:', error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to create notification', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  }

  /**
   * create notifications for multiple users in batch
   */
  async createBulkNotifications(
    data: CreateBulkNotificationsInput,
    context: Context
  ): Promise<any[]> {
    try {
      // validate required fields
      if (!data.userIds || data.userIds.length === 0) {
        throw new GraphQLError('At least one user ID is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (!data.type || data.type.trim() === '') {
        throw new GraphQLError('Notification type is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (!data.notificationType) {
        throw new GraphQLError('Notification type category is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (!data.content || data.content.trim() === '') {
        throw new GraphQLError('Notification content is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // create notifications for each user
      const notifications = await Promise.all(
        data.userIds.map((userId) =>
          this.createNotification(
            {
              userId,
              type: data.type,
              notificationType: data.notificationType,
              priority: data.priority,
              content: data.content,
              actionUrl: data.actionUrl,
              metadata: data.metadata,
              expiresAt: data.expiresAt,
              scheduledFor: data.scheduledFor,
              relatedCarePlanId: data.relatedCarePlanId,
              relatedChatId: data.relatedChatId,
              relatedForumPostId: data.relatedForumPostId,
            },
            context
          )
        )
      );

      return notifications;
    } catch (error: any) {
      console.error('Create bulk notifications error:', error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to create bulk notifications', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  }

  /**
   * mark a single notification as read
   */
  async markAsRead(notificationId: string, userId: string, context: Context): Promise<any> {
    try {
      // validate inputs
      if (!notificationId) {
        throw new GraphQLError('Notification ID is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (!userId) {
        throw new GraphQLError('User ID is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // check if notification exists and belongs to user
      const notification = await context.db.Notification.findOne({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new GraphQLError('Notification not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // update notification as read
      const updatedNotification = await context.db.Notification.updateOne({
        where: { id: notificationId },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      // log notification read
      logger.info('Notification marked as read', {
        notificationId,
        userId,
      });

      // decrement unread counters if it was previously unread, and publish
      try {
        if (notification.read === false) {
          const redis = getRedisClient();
          const key = getUnreadKey(userId);
          const results = await redis
            .multi()
            .hincrby(key, 'total', -1)
            .hincrby(key, String(notification.notificationType), -1)
            .exec();
          const newTotal =
            Array.isArray(results) && results[0] && results[0][1] != null
              ? Number(results[0][1])
              : undefined;
          if (newTotal != null) {
            pubsub.publish(SubscriptionTopics.UNREAD_COUNT_CHANGED, {
              userId,
              count: newTotal,
            });
          }
        }
      } catch (e) {
        console.error('Redis decrement/publish failed after markAsRead:', e);
      }

      return updatedNotification;
    } catch (error: any) {
      console.error('Mark as read error:', error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to mark notification as read', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  }

  /**
   * mark all notifications as read for a user
   */
  async markAllAsRead(userId: string, context: Context): Promise<number> {
    try {
      // validate input
      if (!userId) {
        throw new GraphQLError('User ID is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // get all unread notifications for the user first
      const unreadNotifications = await context.prisma.notification.updateMany({
        where: {
          user: { id: { equals: userId } },
          read: { equals: false },
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
      const count = unreadNotifications.count;

      // log bulk read action
      logger.info('All notifications marked as read', {
        userId,
        count,
      });

      // reset Redis counters to zero and publish
      try {
        const redis = getRedisClient();
        const key = getUnreadKey(userId);
        const TYPES = ['CARE_PLAN', 'CHAT', 'FORUM', 'SYSTEM'];
        const multi = redis.multi();
        multi.hset(key, 'total', 0);
        TYPES.forEach((t) => multi.hset(key, t, 0));
        await multi.exec();
        pubsub.publish(SubscriptionTopics.UNREAD_COUNT_CHANGED, {
          userId,
          count: 0,
        });
      } catch (e) {
        console.error('Redis reset/publish failed after markAllAsRead:', e);
      }

      return count;
    } catch (error: any) {
      console.error('Mark all as read error:', error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to mark all notifications as read', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  }

  /**
   * delete a notification (soft or hard delete)
   * this implementation does a hard delete
   */
  async deleteNotification(
    notificationId: string,
    userId: string,
    context: Context
  ): Promise<boolean> {
    try {
      // validate inputs
      if (!notificationId) {
        throw new GraphQLError('Notification ID is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (!userId) {
        throw new GraphQLError('User ID is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // check if notification exists and belongs to user
      const notification = await context.db.Notification.findOne({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new GraphQLError('Notification not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // delete the notification
      await context.db.Notification.deleteOne({
        where: { id: notificationId },
      });

      // log notification deletion
      logger.info('Notification deleted', {
        notificationId,
        userId,
      });

      return true;
    } catch (error: any) {
      console.error('Delete notification error:', error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to delete notification', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  }

  /**
   * get unread notification count for a user
   */
  async getUnreadCount(userId: string, context: Context): Promise<number> {
    try {
      // validate input
      if (!userId) {
        throw new GraphQLError('User ID is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Redis-only read for unread total
      const redis = getRedisClient();
      const key = getUnreadKey(userId);
      const value = await redis.hget(key, 'total');
      if (value === null) {
        throw new GraphQLError('Unread count cache miss', {
          extensions: { code: 'CACHE_MISS' },
        });
      }
      return parseInt(value, 10) || 0;
    } catch (error: any) {
      console.error('Get unread count error:', error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to get unread count', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  }

  /**
   * get unread notification count by type for a user
   */
  async getUnreadCountByType(
    userId: string,
    type: NotificationType,
    context: Context
  ): Promise<number> {
    try {
      // validate inputs
      if (!userId) {
        throw new GraphQLError('User ID is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (!type) {
        throw new GraphQLError('Notification type is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Redis-only read for unread by type
      const redis = getRedisClient();
      const key = getUnreadKey(userId);
      const value = await redis.hget(key, String(type));
      if (value === null) {
        throw new GraphQLError('Unread count by type cache miss', {
          extensions: { code: 'CACHE_MISS' },
        });
      }
      return parseInt(value, 10) || 0;
    } catch (error: any) {
      console.error('Get unread count by type error:', error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to get unread count by type', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  }

  /**
   * get paginated notifications with filters
   */
  async getNotifications(
    userId: string,
    filters: NotificationFilters = {},
    context: Context
  ): Promise<PaginatedNotificationsResponse> {
    try {
      // validate input
      if (!userId) {
        throw new GraphQLError('User ID is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // build where clause
      const where: any = {
        user: { id: { equals: userId } },
      };

      // apply filters
      if (filters.read !== undefined) {
        where.read = { equals: filters.read };
      }

      if (filters.notificationType) {
        where.notificationType = { equals: filters.notificationType };
      }

      if (filters.priority) {
        where.priority = { equals: filters.priority };
      }

      if (filters.startDate) {
        where.createdAt = { gte: filters.startDate };
      }

      if (filters.endDate) {
        if (where.createdAt) {
          where.createdAt.lte = filters.endDate;
        } else {
          where.createdAt = { lte: filters.endDate };
        }
      }

      // set pagination defaults
      const take = filters.take || 20;
      const skip = filters.skip || 0;

      // fetch notifications
      const notifications = await context.db.Notification.findMany({
        where,
        take: take + 1, // fetch one extra to check if there are more
        skip,
        orderBy: { createdAt: 'desc' },
      });

      // check if there are more results
      const hasMore = notifications.length > take;
      const results = hasMore ? notifications.slice(0, take) : notifications;

      // get total count
      const total = await context.db.Notification.count({ where });

      return {
        notifications: [...results], // convert readonly array to mutable
        total,
        hasMore,
        skip,
        take,
      };
    } catch (error: any) {
      console.error('Get notifications error:', error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to get notifications', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  }
}

// export singleton instance
export const notificationService = new NotificationService();
