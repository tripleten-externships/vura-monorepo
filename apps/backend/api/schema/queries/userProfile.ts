import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import { UserProfileService } from '../../../services/user';
import { getEventBus } from '../../subscriptions/eventBus';

export const userProfile = async (root: any, args: any, context: Context) => {
  if (!context.session?.data?.id) {
    throw new GraphQLError('You must be logged in to view your profile', {
      extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } },
    });
  }

  try {
    const profileService = new UserProfileService({ context, eventBus: getEventBus() });
    return profileService.getCurrentUser(context.session.data.id);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new GraphQLError('Failed to fetch user profile', {
      extensions: { code: 'INTERNAL_SERVER_ERROR', http: { status: 500 } },
    });
  }
};
