import { withFilter } from 'graphql-subscriptions';
import { pubsub, SubscriptionTopics } from '../subscriptions/pubsub';
import { Context } from '../../types/context';

// Subscription resolvers
export const Subscription = {
  // Subscribe to new chat messages in a specific group
  messageSent: {
    subscribe: withFilter(
      () => pubsub.asyncIterableIterator(SubscriptionTopics.NEW_CHAT_MESSAGE),
      async (payload, variables, context: any) => {
        const userId = context.session?.data?.id;
        if (!userId) return false;

        if (payload.groupId !== variables.groupId) return false;

        const group = await context.query.GroupChat.findOne({
          where: { id: variables.groupId },
          query: 'id owner { id } members { id }',
        });
        if (!group) return false;
        const isOwner = group.owner?.id === userId;
        const isMember =
          Array.isArray(group.members) &&
          group.members.some((m: { id: string }) => m.id === userId);
        return isOwner || isMember;
      }
    ),
    resolve: (payload: any) => {
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
      async (payload, variables, context: any) => {
        const userId = context.session?.data?.id;
        if (!userId) return false;
        if (payload.groupId !== variables.groupId) return false;

        const group = await context.query.GroupChat.findOne({
          where: { id: variables.groupId },
          query: 'id owner { id } members { id }',
        });
        if (!group) return false;
        const isOwner = group.owner?.id === userId;
        const isMember =
          Array.isArray(group.members) &&
          group.members.some((m: { id: string }) => m.id === userId);
        return isOwner || isMember;
      }
    ),
  },

  // Subscribe to user status changes
  userStatusChanged: {
    subscribe: withFilter(
      () => pubsub.asyncIterableIterator(SubscriptionTopics.USER_STATUS_CHANGED),
      (payload, variables, context: any) => {
        const userId = context.session?.data?.id;
        if (!userId) return false;
        if (variables.userId) {
          return payload.userId === variables.userId;
        }
        return true;
      }
    ),
  },

  // Subscribe to AI chat messages for a specific session
  aiMessageReceived: {
    subscribe: withFilter(
      () => pubsub.asyncIterableIterator(SubscriptionTopics.NEW_AI_MESSAGE),
      async (payload, variables, context: any) => {
        const userId = context.session?.data?.id;
        if (!userId) return false;
        if (payload.sessionId !== variables.sessionId) return false;

        // verify the session belongs to the user
        try {
          const session = await context.query.AiChatSession.findOne({
            where: { id: variables.sessionId },
            query: 'id user { id }',
          });
          return session?.user?.id === userId;
        } catch {
          return false;
        }
      }
    ),
  },
};
