import { Context } from '../../types/context';

/**
 * notification types based on the model
 */
export type NotificationType = 'CARE_PLAN' | 'CHAT' | 'FORUM' | 'SYSTEM';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/**
 * input data for creating a notification
 */
export interface CreateNotificationInput {
  userId: string;
  type: string;
  notificationType: NotificationType;
  priority?: NotificationPriority;
  content: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
  scheduledFor?: Date;
  relatedCarePlanId?: string;
  relatedChatId?: string;
  relatedForumPostId?: string;
}

/**
 * input data for creating bulk notifications
 */
export interface CreateBulkNotificationsInput {
  userIds: string[];
  type: string;
  notificationType: NotificationType;
  priority?: NotificationPriority;
  content: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
  scheduledFor?: Date;
  relatedCarePlanId?: string;
  relatedChatId?: string;
  relatedForumPostId?: string;
}

/**
 * filters for querying notifications
 */
export interface NotificationFilters {
  read?: boolean;
  notificationType?: NotificationType;
  priority?: NotificationPriority;
  startDate?: Date;
  endDate?: Date;
  take?: number;
  skip?: number;
}

/**
 * response for paginated notifications
 */
export interface PaginatedNotificationsResponse {
  notifications: any[];
  total: number;
  hasMore: boolean;
  skip: number;
  take: number;
}

/**
 * service interface
 */
export interface INotificationService {
  createNotification(data: CreateNotificationInput, context: Context): Promise<any>;

  createBulkNotifications(data: CreateBulkNotificationsInput, context: Context): Promise<any[]>;

  markAsRead(notificationId: string, userId: string, context: Context): Promise<any>;

  markAllAsRead(userId: string, context: Context): Promise<number>;

  deleteNotification(notificationId: string, userId: string, context: Context): Promise<boolean>;

  getUnreadCount(userId: string, context: Context): Promise<number>;

  getUnreadCountByType(userId: string, type: NotificationType, context: Context): Promise<number>;

  getNotifications(
    userId: string,
    filters: NotificationFilters,
    context: Context
  ): Promise<PaginatedNotificationsResponse>;
}
