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
import {
  incrementCounter,
  decrementCounter,
  getTotalUnreadCount,
  getUnreadCountByType,
  resetAllCounters,
} from '../cache/db-cache';
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

      // Skip if user is muted or blocked
      const isMuted = await this.isUserMuted(
        data.userId,
        data.metadata?.senderId,
        data.metadata?.groupId
      );
      const isBlocked = await this.isUserBlocked(data.userId, data.metadata?.senderId); // isUserBlocked and isUserMuted

      if (isMuted || isBlocked) {
        return null; // Do not send notification
      }

      // prepare notification data
      const notificationData: any = {
        type: data.type,
        notificationType: data.notificationType,
        priority: data.priority || 'MEDIUM',
        content: data.content,
        user: { connect: { id: data.userId } },
      };

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

      // determine if user is already in chat - if true do not send notifications
      // const userInGroup = websocketService.isUserInGroup(
      //   targetUserId,
      //   groupId
      // );

      // create notification
      // if(!userInGroup) {} --supposed to wrap await

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

      // increment unread counters in database cache and publish events
      try {
        // Increment counter for this notification type
        await incrementCounter(data.userId, notification.notificationType as NotificationType);

        // Get total count across all types
        const totalCount = await getTotalUnreadCount(data.userId);

        // publish unread count changed
        pubsub.publish(SubscriptionTopics.UNREAD_COUNT_CHANGED, {
          userId: data.userId,
          count: totalCount,
        });

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
        logger.error('Counter increment/publish failed after createNotification', { error: e });
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
  // AI helped with this - I am not sure where blocked/muted preferences are currently in the code
  async isUserMuted(userId: string, senderId: string, groupId: string): Promise<boolean> {
    return false;
  }

  async isUserBlocked(userId: string, senderId: string): Promise<boolean> {
    return false;
  } // I think these should be inside curly braces of createNotification, but there is an error when I do that

  // handle batch notifications
  public batchNotifications(context: Context) {
    let buffer: CreateNotificationInput[] = []; // store incoming notifications
    let batching = false; // prevents multiple loops from running

    function onIncomingMessage(msg: CreateNotificationInput) {
      buffer.push(msg);

      if (!batching) {
        batching = true;
        startBatchingLoop();
      }
    }

    async function startBatchingLoop() {
      const batchStartTime = Date.now();
      const max_iterations = 500; // arbitrary #

      for (let i = 0; i < max_iterations; i++) {
        if (Date.now() - batchStartTime >= 30000) {
          // stop if 30 seconds (arbitrary) passes
          sendBatch();
          batching = false;
          return;
        }

        await new Promise((res) => setTimeout(res, 50)); // pausing to make sure loop doesn't pass too quickly
      }

      sendBatch();
      batching = false;
    }

    async function sendBatch() {
      if (buffer.length === 0) {
        return; // nothing to send
      }

      const batch = buffer;
      buffer = []; // clear buffer

      try {
        await Promise.all(
          batch.map((notification) => context.db.Notification.createOne({ data: notification }))
        );
      } catch (err) {
        console.error('Error sending notification batch:', err);
      }
    }

    // return function used when a new message arrives
    return onIncomingMessage;
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
      // only notify user if the are not in chat by checking online status
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
      if (notification.read === false) {
        try {
          // Decrement counter for this notification type
          await decrementCounter(userId, notification.notificationType as NotificationType);

          // Get new total count across all types
          const newTotal = await getTotalUnreadCount(userId);

          pubsub.publish(SubscriptionTopics.UNREAD_COUNT_CHANGED, {
            userId,
            count: newTotal,
          });
        } catch (e) {
          logger.error('Counter decrement/publish failed after markAsRead', { error: e });
        }
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

      // reset all counters to zero and publish
      try {
        await resetAllCounters(userId);

        pubsub.publish(SubscriptionTopics.UNREAD_COUNT_CHANGED, {
          userId,
          count: 0,
        });
      } catch (e) {
        logger.error('Counter reset/publish failed after markAllAsRead', { error: e });
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

      // Get count from database cache (fast with proper indexing)
      const count = await getTotalUnreadCount(userId);
      return count;
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

      // Get count from database cache (fast with proper indexing)
      const count = await getUnreadCountByType(userId, type);
      return count;
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

export const notificationService = new NotificationService();
