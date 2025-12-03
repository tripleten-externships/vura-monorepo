import { Context } from '../../types/context';
import { EventBus } from '../../api/subscriptions/eventBus';

/**
 * base class shared by all domain services so they have a common place to grab the keystone context
 * and the event bus. even though this is tiny, it keeps constructors consistent and makes future
 * cross-cutting concerns (metrics, tracing, etc.) easy to add in one spot.
 */
export interface ServiceDependencies {
  context: Context;
  eventBus: EventBus;
}

export abstract class BaseService {
  protected readonly context: Context;
  protected readonly eventBus: EventBus;

  protected constructor(deps: ServiceDependencies) {
    this.context = deps.context;
    this.eventBus = deps.eventBus;
  }
}
