import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import { pubsub, SubscriptionTopics } from '../../subscriptions/pubsub';

export interface UserStatusInput {
  status: 'online' | 'offline';
}

export const updateUserStatus = async (
  _: any,
  { input }: { input: UserStatusInput },
  context: Context
) => {
  const session = context.session;

  // Check if user is logged in
  if (!session?.data?.id) {
    throw new GraphQLError('User must be authenticated', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  const { status } = input;

  try {
    // Get user details
    const user = await context.query.User.findOne({
      where: { id: session.data.id },
      query: 'id name email',
    });

    if (!user) {
      throw new GraphQLError('User not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Create payload for the user status
    const payload = {
      userId: session.data.id,
      username: user.name || user.email,
      status,
    };

    // Publish to the USER_STATUS_CHANGED topic
    pubsub.publish(SubscriptionTopics.USER_STATUS_CHANGED, payload);

    return {
      success: true,
      message: `User status updated to ${status}`,
    };
  } catch (error: any) {
    console.error('Error updating user status:', error);
    throw new GraphQLError('Failed to update user status', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
