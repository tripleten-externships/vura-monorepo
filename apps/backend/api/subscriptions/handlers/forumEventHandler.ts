import { Context } from '../../../types/context';
import { pubsub, SubscriptionTopics } from '../pubsub';
import { ForumPostCreatedEvent } from '../events';
import { forumNotificationService } from '../../../services/forum';
import { logger } from '../../../utils/logger';

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
 * Handle forumPost created events
 * Creates notifications for group members and mentioned users
 */
export async function handleforumPostCreated(
  event: ForumPostCreatedEvent,
  context: Context
): Promise<void> {
  try {
    // get all recipients
    const recipientIds = event.subscriberIds.filter((id) => id !== event.userId);
    console.log('event.subscriberIds:', event.subscriberIds);
    console.log('recipientIds:', recipientIds);

    if (recipientIds.length === 0) {
      logger.debug('No subscribers for forum topic', { postId: event.postId });
      return;
    }
    // extract mentions from the content
    const mentionedUsers = extractMentions(event.content);

    // separate mentioned users from regular recipients
    const mentionedRecipients = recipientIds.filter((id) => mentionedUsers.includes(id));
    const regularRecipients = recipientIds.filter((id) => !mentionedUsers.includes(id));

    // create HIGH priority notifications for mentioned users
    if (mentionedRecipients.length > 0) {
      console.log(
        'Notification content:',
        `${event.authorName} mentioned you in a post about ${event.topic}`
      );
      const mentionednotifications = await forumNotificationService.createBulkForumNotifications(
        {
          userIds: mentionedRecipients,
          forumPostType: 'NEW_POST',
          priority: 'HIGH',
          title: event.title,
          topic: event.topic,
          content: `${event.authorName} mentioned you in a post about ${event.topic}`,
          metadata: {
            postId: event.postId,
            topic: event.topic,
            authorId: event.userId,
            authorName: event.authorName,
          },
        },
        context
      );

      console.log('mentionednotifications:', mentionednotifications);

      // publish notification created events for real-time updates
      mentionednotifications.forEach((subscribe) => {
        pubsub.publish(SubscriptionTopics.FORUM_POST_CREATED, {
          userId: subscribe.user?.id || subscribe.userId,
          postId: event.postId,
          topic: event.topic,
          createdAt: subscribe.createdAt,
          subscriberIds: mentionedRecipients,
          content: `${event.authorName} mentioned you in a post about ${event.topic}`,
          authorName: event.authorName,
        });
      });
      logger.info('High priority notifications created for mentions', {
        postId: event.postId,
        count: mentionedRecipients.length,
      });
    }

    // create MEDIUM priority notifications for other group members
    if (regularRecipients.length > 0) {
      const mentionednotifications = await forumNotificationService.createBulkForumNotifications(
        {
          userIds: regularRecipients,
          forumPostType: 'NEW_POST',
          priority: 'MEDIUM',
          title: event.title,
          topic: event.topic,
          content: `${event.authorName} created a new post in the ${event.topic}`,
          metadata: {
            postId: event.postId,
            topic: event.topic,
            authorId: event.userId,
            authorName: event.authorName,
          },
        },
        context
      );

      // publish notification created events for real-time updates
      mentionednotifications.forEach((notification) => {
        pubsub.publish(SubscriptionTopics.FORUM_NOTIFICATION, {
          notificationId: notification.id,
          userId: notification.userId,
          type: 'NEW_POST',
          notificationType: 'MENTION',
          priority: notification.priority,
          content: notification.content,
          metadata: notification.metadata,
          createdAt: notification.createdAt,
        });
      });
      logger.info('New forum post notifications processed', {
        messageId: event.postId,
        mentions: mentionedRecipients.length,
        regular: regularRecipients.length,
      });
    }
  } catch (error) {
    logger.error('Error handling forumPost created event', {
      error,
      postId: event.postId,
    });
  }
}

/**
 * Initialize forumPost event handlers
 * Sets up listeners for  forum post creation events
 */
export function initializeForumPostEventHandlers(context: Context): void {
  pubsub.subscribe(SubscriptionTopics.FORUM_POST_CREATED, (payload: ForumPostCreatedEvent) => {
    handleforumPostCreated(payload, context).catch((error) => {
      logger.error('Error in forum event handler', { error });
    });
  });

  logger.info('forum event handlers initialized');
}
