import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import { UserProfileService } from '../../../services/user';
import { getEventBus } from '../../subscriptions/eventBus';

export const customDeleteAccount = async (_: any, __: any, context: Context) => {
  if (!context.session?.data?.id) {
    throw new GraphQLError('User must be authenticated', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  const profileService = new UserProfileService({ context, eventBus: getEventBus() });
  await profileService.deleteCurrentUser(context.session.data.id);

  return {
    success: true,
    message: 'Account deleted successfully',
  };
};
