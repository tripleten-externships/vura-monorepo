import { PubSub } from 'graphql-subscriptions';

// create a PubSub instance for publishing and subscribing to events
export const pubsub = new PubSub();

// define subscription topics/channels
export enum SubscriptionTopics {
  NEW_CHAT_MESSAGE = 'NEW_CHAT_MESSAGE',
  TYPING_INDICATOR = 'TYPING_INDICATOR',
  USER_STATUS_CHANGED = 'USER_STATUS_CHANGED',
  NEW_AI_MESSAGE = 'NEW_AI_MESSAGE',
}
