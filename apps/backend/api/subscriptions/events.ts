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
  title: string;
  createdAt: string;
  subscriberIds: string[];
  content: string;
  authorName: string;
  type?: string;
  forumPostType?: 'NEW_POST' | 'REPLY_TO_YOUR_POST' | 'REPLY_TO_SUBSCRIBED_POST';
}

export interface QuestionnaireAssignedEvent {
  assignmentId?: string;
  userId: string;
  questionnaireId?: string;
  questionnaireTitle?: string | null;
  carePlanId?: string | null;
}

export interface QuestionnaireCompletedEvent {
  questionnaireResponseId: string;
  userId: string;
  questionnaireId?: string;
  questionnaireTitle?: string | null;
  carePlanId?: string | null;
}
