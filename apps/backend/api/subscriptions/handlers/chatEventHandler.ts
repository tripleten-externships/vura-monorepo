import { SubscriptionTopics } from '../pubsub';
import { ChatMessageCreatedEvent } from '../events';
import { notificationService } from '../../../services/notification';
import {
  newGroupMessageTemplate,
  mentionTemplate,
} from '../../../services/notification/templates/chat';
import { Context } from '../../../types/context';
import { logger } from '../../../utils/logger';
import { EventBus } from '../eventBus';

/**
 * Extract user IDs mentioned in the message content
 * Supports @mentions in the format @userId
 */
function extractMentions(message: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9-_]+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(message)) !== null) {
    mentions.push(match[1]);
  }

  return [...new Set(mentions)];
}

/**
 * Handle chat message created events
 * Creates notifications for group members and mentioned users
 */
export async function handleChatMessageCreated(
  event: ChatMessageCreatedEvent,
  context: Context,
  eventBus: EventBus
): Promise<void> {
  try {
    // get all recipients (exclude sender)
    const recipientIds = event.memberIds.filter((memberId) => memberId !== event.senderId);

    if (recipientIds.length === 0) {
      logger.debug('No recipients for chat notification', { messageId: event.messageId });
      return;
    }

    // extract mentions from the message
    const mentionedUserIds = extractMentions(event.message);

    // separate mentioned users from regular recipients
    const mentionedRecipients = recipientIds.filter((userId) => mentionedUserIds.includes(userId));
    const regularRecipients = recipientIds.filter((userId) => !mentionedUserIds.includes(userId));

    // create HIGH priority notifications for mentioned users
    if (mentionedRecipients.length > 0) {
      const mentionNotificationData = mentionTemplate({
        groupId: event.groupId,
        groupName: event.groupName,
        senderId: event.senderId,
        senderName: event.senderName,
        message: event.message,
        messageId: event.messageId,
      });

      const notifications = await notificationService.createBulkNotifications(
        {
          userIds: mentionedRecipients,
          ...mentionNotificationData,
        },
        context
      );

      notifications.forEach((notification) => {
        eventBus.publish(SubscriptionTopics.NOTIFICATION_CREATED, {
          userId: notification.user?.id || notification.userId,
          notificationId: notification.id,
          type: notification.type,
          notificationType: notification.notificationType,
          priority: notification.priority,
          content: notification.content,
          actionUrl: notification.actionUrl,
          metadata: notification.metadata,
          createdAt: notification.createdAt,
        });

        notificationService
          .getUnreadCount(notification.user?.id || notification.userId, context)
          .then((count) => {
            eventBus.publish(SubscriptionTopics.UNREAD_COUNT_CHANGED, {
              userId: notification.user?.id || notification.userId,
              count,
            });
          });
      });

      logger.info('High priority notifications created for mentions', {
        messageId: event.messageId,
        count: mentionedRecipients.length,
      });
    }

    // create MEDIUM priority notifications for other group members
    if (regularRecipients.length > 0) {
      const messageNotificationData = newGroupMessageTemplate({
        groupId: event.groupId,
        groupName: event.groupName,
        senderId: event.senderId,
        senderName: event.senderName,
        message: event.message,
        messageId: event.messageId,
      });

      const notifications = await notificationService.createBulkNotifications(
        {
          userIds: regularRecipients,
          ...messageNotificationData,
        },
        context
      );

      notifications.forEach((notification) => {
        eventBus.publish(SubscriptionTopics.NOTIFICATION_CREATED, {
          userId: notification.user?.id || notification.userId,
          notificationId: notification.id,
          type: notification.type,
          notificationType: notification.notificationType,
          priority: notification.priority,
          content: notification.content,
          actionUrl: notification.actionUrl,
          metadata: notification.metadata,
          createdAt: notification.createdAt,
        });

        notificationService
          .getUnreadCount(notification.user?.id || notification.userId, context)
          .then((count) => {
            eventBus.publish(SubscriptionTopics.UNREAD_COUNT_CHANGED, {
              userId: notification.user?.id || notification.userId,
              count,
            });
          });
      });

      logger.info('Regular notifications created for chat message', {
        messageId: event.messageId,
        count: regularRecipients.length,
      });
    }

    logger.info('Chat message notifications processed', {
      messageId: event.messageId,
      mentions: mentionedRecipients.length,
      regular: regularRecipients.length,
    });
  } catch (error) {
    logger.error('Error handling chat message created event', {
      error,
      messageId: event.messageId,
    });
    // don't throw - this is an async event handler
  }
}

/**
 * Initialize chat event handlers
 * Sets up listeners for chat-related events
 */
export function initializeChatEventHandlers(context: Context, eventBus: EventBus): void {
  // subscribe to CHAT_MESSAGE_CREATED events using the shared event bus so we have a single place
  // to manage retries/logging. this keeps the handler detached from the underlying pubsub impl.
  eventBus.subscribe(
    SubscriptionTopics.CHAT_MESSAGE_CREATED,
    (payload: ChatMessageCreatedEvent) => {
      handleChatMessageCreated(payload, context, eventBus).catch((error) => {
        logger.error('Error in chat event handler', { error });
      });
    }
  );

  logger.info('Chat event handlers initialized');
}
