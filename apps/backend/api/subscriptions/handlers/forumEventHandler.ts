import { Context } from '../../../types/context';
import { SubscriptionTopics } from '../pubsub';
import { ForumPostCreatedEvent } from '../events';
import { logger } from '../../../utils/logger';
import { EventBus } from '../eventBus';
import { ForumService } from '../../../services/forum';

/**
 * Handle forumPost created events
 * Creates notifications for group members and mentioned users
 */

export async function handleforumPostCreated(
  event: ForumPostCreatedEvent,
  context: Context,
  eventBus: EventBus
): Promise<void> {
  try {
    const forumService = new ForumService({ context, eventBus });
    await forumService.dispatchForumNotifications(event);
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
export function initializeForumPostEventHandlers(context: Context, eventBus: EventBus): void {
  eventBus.subscribe(SubscriptionTopics.FORUM_POST_CREATED, (payload: ForumPostCreatedEvent) => {
    handleforumPostCreated(payload, context, eventBus).catch((error) => {
      logger.error('Error in forum event handler', { error });
    });
  });

  logger.info('forum event handlers initialized');
}
