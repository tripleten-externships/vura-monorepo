import { GraphQLError } from 'graphql';
import type { KeystoneContext } from '@keystone-6/core/types';
import { ResourceService } from '../../../services/resource/resource.service';
import { GetResourcesInput } from '../../../services/resource/types';
import { getEventBus } from '../../subscriptions/eventBus';

export const getResources = async (
  _parent: unknown,
  { input }: { input?: GetResourcesInput },
  context: KeystoneContext
) => {
  try {
    const resourceService = new ResourceService({ context, eventBus: getEventBus() });
    return resourceService.listResources(input);
  } catch (err: unknown) {
    if (err instanceof GraphQLError) {
      throw err;
    }

    console.error('Failed to fetch resources:', err);
    throw new GraphQLError('Failed to fetch resources', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
