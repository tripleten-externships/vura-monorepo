export type ForumPostType = 'NEW_POST' | 'REPLY_TO_YOUR_POST' | 'REPLY_TO_SUBSCRIBED_POST';

export type ForumPostPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/**
 * input data for creating a forumPost
 */
export interface CreateForumPostInput {
  title: string;
  topic: string;
  forumPostType?: ForumPostType;
  priority?: ForumPostPriority;
  content: string;
  metadata?: Record<string, any>;
}

export interface CreateSubscribeForum {
  userId: string;
  authorName: string;
  topic: string;
  metadata?: Record<string, any>;
  postId?: string;
}

export interface ListForumPostsInput {
  first?: number;
  after?: string;
  topic?: string;
  authorId?: string;
  searchTerm?: string;
  dateFrom?: Date;
  dateTo?: Date;
  orderBy?:
    | 'CREATED_AT_ASC'
    | 'CREATED_AT_DESC'
    | 'UPDATED_AT_ASC'
    | 'UPDATED_AT_DESC'
    | 'TITLE_ASC'
    | 'TITLE_DESC';
}

import { NotificationPriority } from '../notification/types';

export interface ForumNotificationCreateData {
  title?: string;
  topic?: string;
  content: string;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
  actionUrl?: string;
  expiresAt?: Date;
  scheduledFor?: Date;
  relatedForumPostId?: string;
  userId: string;
  type: string;
  forumPostType?: string;
  notificationType?: 'CARE_PLAN' | 'CHAT' | 'FORUM' | 'SYSTEM';
}
