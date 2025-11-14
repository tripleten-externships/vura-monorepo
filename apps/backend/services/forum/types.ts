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
  title: string;
  topic: string;
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

export interface CreateSubscribeForum {
  userId: string;
  type: string;
  authorName: string;
  postId: string;
  priority?: string;
  content: string;
  actionUrl?: string;
  topic: string;
  metadata?: Record<string, any>;
}

export interface ForumNotificationCreateData {
  title: string;
  topic: string;
  content: string;
  priority?: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
  expiresAt?: Date;
  scheduledFor?: Date;
  relatedForumPostId?: string;
  author: { connect: { id: string } };
  userId: string;
  type: string;
  forumPostType?: string;
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
  title: string;
  topic: string;
}

/**
 * service interface
 */
export interface IForumNotificationService {
  createForumNotification(data: ForumNotificationCreateData, context: Context): Promise<any>;

  createBulkForumNotifications(
    data: CreateBulkForumNotificationsInput,
    context: Context
  ): Promise<any[]>;
  createSubscription(data: CreateSubscribeForum, context: Context): Promise<any>;
  createUnSubscription(userId: string, topic: string, context: Context): Promise<boolean>;
}
