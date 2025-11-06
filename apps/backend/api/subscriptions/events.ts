/**
 * Event payloads for the pub/sub system
 * These define the structure of events that flow through the system
 */

export interface ChatMessageCreatedEvent {
  messageId: string;
  message: string;
  senderId: string;
  senderName: string;
  groupId: string;
  groupName: string;
  createdAt: string;
  // include all member IDs for notification processing
  memberIds: string[];
}

export interface NotificationCreatedEvent {
  notificationId: string;
  userId: string;
  type: string;
  notificationType: string;
  priority: string;
  content: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface UnreadCountChangedEvent {
  userId: string;
  count: number;
  notificationType?: string;
}

export interface ForumPostCreatedEvent {
  userId: string;
  postId: string;
  topic: string;
  createdAt: string;
  subscriberIds: string[];
  content: string;
  authorName: string;
}
