import { pubsub, SubscriptionTopics } from './pubsub';
import { logger } from '../../utils/logger';

type FanOutHandler<TPayload> = (payload: TPayload) => void | Promise<void>;

/**
 * very small event bus wrapper around graphql-subscriptions so we can fan events out to multiple
 * transports (graphql subscriptions, websocket pushes, cron workers, etc.) without every resolver
 * duplicating the same wiring. it keeps the publish logic in one place and makes it easier to bolt
 * on more consumers later.
 */
export class EventBus {
  private readonly fanOutMap = new Map<SubscriptionTopics, FanOutHandler<any>[]>();

  publish<TPayload>(topic: SubscriptionTopics, payload: TPayload): void {
    pubsub.publish(topic, payload);
    const fanOutHandlers = this.fanOutMap.get(topic) ?? [];
    fanOutHandlers.forEach((handler) => {
      Promise.resolve(handler(payload)).catch((error) => {
        logger.error('event fanout failed', { topic, error });
      });
    });
  }

  subscribe<TPayload>(
    topic: SubscriptionTopics,
    handler: FanOutHandler<TPayload>
  ): Promise<number> {
    return pubsub.subscribe(topic, (payload: TPayload) => {
      Promise.resolve(handler(payload)).catch((error) => {
        logger.error('event handler crashed', { topic, error });
      });
    });
  }

  addFanOut<TPayload>(topic: SubscriptionTopics, handler: FanOutHandler<TPayload>): void {
    const handlers = this.fanOutMap.get(topic) ?? [];
    handlers.push(handler);
    this.fanOutMap.set(topic, handlers);
  }
}

let eventBusInstance: EventBus | null = null;

export function initEventBus(): EventBus {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus();
  }
  return eventBusInstance;
}

export function getEventBus(): EventBus {
  if (!eventBusInstance) {
    throw new Error('event bus has not been initialized yet');
  }
  return eventBusInstance;
}
