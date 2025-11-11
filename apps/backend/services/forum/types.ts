import { Context } from '../../types/context';

/**
 * forum types based on the model
 */
export type ForumPostType = 'NEW_POST' | 'REPLY_TO_YOUR_POST' | 'REPLY_TO_SUBSCRIBED_POST';

export type ForumPostPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/**
 * input data for creating a forumPost
 */
export interface CreateForumPostInput {
  userId: string;
  type: string;
  forumPostType?: string;
  priority?: ForumPostPriority;
  content: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
  scheduledFor?: Date;
  relatedForumPostId?: string;
}

/**
 * input data for creating bulk forumnotifications
 */
export interface CreateBulkForumNotificationsInput {
  userIds: string[];
  forumPostType?: string;
  priority?: ForumPostPriority;
  content: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
  scheduledFor?: Date;
  relatedForumPostId?: string;
}

/**
 * service interface
 */
export interface IForumNotificationService {
  createForumNotification(data: CreateForumPostInput, context: Context): Promise<any>;

  createBulkForumNotifications(
    data: CreateBulkForumNotificationsInput,
    context: Context
  ): Promise<any[]>;
}
