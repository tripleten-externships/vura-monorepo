import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import { pubsub, SubscriptionTopics } from '../../subscriptions/pubsub';

export interface TypingIndicatorInput {
  groupId: string;
  isTyping: boolean;
}

export const typingIndicator = async (
  _: any,
  { input }: { input: TypingIndicatorInput },
  context: Context
) => {
  const session = context.session;

  // Check if user is logged in
  if (!session?.data?.id) {
    throw new GraphQLError('User must be authenticated', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  const { groupId, isTyping } = input;

  // Validate input
  if (!groupId) {
    throw new GraphQLError('Group ID is required', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

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

    // Create payload for the typing indicator
    const payload = {
      userId: session.data.id,
      username: user.name || user.email,
      groupId,
      isTyping,
    };

    // Publish to the TYPING_INDICATOR topic
    pubsub.publish(SubscriptionTopics.TYPING_INDICATOR, payload);

    return {
      success: true,
      message: isTyping ? 'Typing indicator sent' : 'Typing indicator stopped',
    };
  } catch (error: any) {
    console.error('Error sending typing indicator:', error);
    throw new GraphQLError('Failed to send typing indicator', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
