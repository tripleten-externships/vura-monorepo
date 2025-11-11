import { GraphQLError } from 'graphql';
import { Context } from '../../types/context';
import {
  CreateForumPostInput,
  CreateBulkForumNotificationsInput,
  IForumNotificationService,
} from './types';
import { logger } from '../../utils/logger';

export class ForumNotificationService implements IForumNotificationService {
  /**
   * create and persist a single notification
   */
  async createForumNotification(data: CreateForumPostInput, context: Context): Promise<any> {
    try {
      // validate required fields
      if (!data.userId) {
        throw new GraphQLError('User ID is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (!data.forumPostType) {
        throw new GraphQLError('ForumNotification type category is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (!data.type || data.type.trim() === '') {
        throw new GraphQLError('ForumNotification sub-type is required', {
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
        user: { connect: { id: data.userId } },
        type: 'FORUM',
        forumPostType: data.forumPostType,
        priority: data.priority || 'MEDIUM',
        content: data.content,
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
      logger.info('forumNotification created', {
        notificationId: notification.id,
        userId: data.userId,
        type: data.type,
        ForumPostType: data.forumPostType,
      });

      return notification;
    } catch (error: any) {
      console.error('Create forumNotification error:', error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to create forumNotification', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  }

  /**
   * create notifications for multiple users in batch
   */
  async createBulkForumNotifications(
    data: CreateBulkForumNotificationsInput,
    context: Context
  ): Promise<any[]> {
    try {
      // validate required fields
      if (!data.userIds || data.userIds.length === 0) {
        throw new GraphQLError('At least one user ID is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (!data.forumPostType || data.forumPostType.trim() === '') {
        throw new GraphQLError('Notification type is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (!data.forumPostType) {
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
          this.createForumNotification(
            {
              userId,
              type: 'FORUM',
              forumPostType: data.forumPostType,
              priority: data.priority,
              content: data.content,
              actionUrl: data.actionUrl,
              metadata: data.metadata,
              expiresAt: data.expiresAt,
              scheduledFor: data.scheduledFor,
              relatedForumPostId: data.relatedForumPostId,
            },
            context
          )
        )
      );

      return notifications;
    } catch (error: any) {
      console.error('Create bulk forumNotifications error:', error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to create bulk forumNotifications', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  }
}

// export singleton instance
export const forumNotificationService = new ForumNotificationService();
