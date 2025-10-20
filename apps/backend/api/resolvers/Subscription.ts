import { withFilter } from 'graphql-subscriptions';
import { pubsub, SubscriptionTopics } from '../subscriptions/pubsub';
import { Context } from '../../types/context';

// Subscription resolvers
export const Subscription = {
  // Subscribe to new chat messages in a specific group
  messageSent: {
    subscribe: withFilter(
      () => pubsub.asyncIterableIterator(SubscriptionTopics.NEW_CHAT_MESSAGE),
      (payload, variables, context) => {
        // Filter messages by group ID
        return payload.groupId === variables.groupId;
      }
    ),
    resolve: (payload: any) => {
      // Return the message data
      return {
        id: payload.id,
        message: payload.message,
        createdAt: payload.createdAt,
        sender: payload.sender,
        group: payload.groupId,
      };
    },
  },

  // Subscribe to typing indicators in a specific group
  typingIndicator: {
    subscribe: withFilter(
      () => pubsub.asyncIterableIterator(SubscriptionTopics.TYPING_INDICATOR),
      (payload, variables) => {
        // Filter typing indicators by group ID
        return payload.groupId === variables.groupId;
      }
    ),
  },

  // Subscribe to user status changes
  userStatusChanged: {
    subscribe: withFilter(
      () => pubsub.asyncIterableIterator(SubscriptionTopics.USER_STATUS_CHANGED),
      (payload, variables) => {
        // If userId is provided, filter by that user ID
        if (variables.userId) {
          return payload.userId === variables.userId;
        }
        // Otherwise, return all user status changes
        return true;
      }
    ),
  },

  // Subscribe to AI chat messages for a specific session
  aiMessageReceived: {
    subscribe: withFilter(
      () => pubsub.asyncIterableIterator(SubscriptionTopics.NEW_AI_MESSAGE),
      (payload, variables) => {
        // Filter AI messages by session ID
        return payload.sessionId === variables.sessionId;
      }
    ),
  },
};
