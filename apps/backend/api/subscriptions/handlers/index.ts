import { Context } from '../../../types/context';
import { initializeChatEventHandlers } from './chatEventHandler';
import { initializeForumPostEventHandlers } from './forumEventHandler';
import { logger } from '../../../utils/logger';

/**
 * Initialize all event handlers for the pub/sub system
 * This sets up listeners that react to events published throughout the application
 *
 * Event-driven architecture benefits:
 * - Loose coupling: Handlers are independent of event publishers
 * - Scalability: New handlers can be added without modifying publishers
 * - Async processing: Events are processed asynchronously
 * - Resilience: Handler failures don't affect the main flow
 */
export function initializeEventHandlers(context: Context): void {
  logger.info('Initializing event handlers...');

  try {
    // initialize chat event handlers (notifications for messages, mentions, etc)
    initializeChatEventHandlers(context);
    initializeForumPostEventHandlers(context);

    // future handlers can be added here:
    // initializeForumEventHandlers(context);
    // initializeCarePlanEventHandlers(context);
    // initializeScheduledTaskHandlers(context);

    logger.info('All event handlers initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize event handlers', { error });
    // don't throw - allow the app to start even if handlers fail
  }
}
