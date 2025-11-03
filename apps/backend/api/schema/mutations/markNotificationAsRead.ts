import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import { notificationService } from '../../../services/notification';

export const customMarkNotificationAsRead = async (
  _: any,
  { notificationId }: { notificationId: string },
  context: Context
) => {
  try {
    if (!context.session?.data?.id) {
      throw new GraphQLError('User must be authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const notification = await notificationService.markAsRead(
      notificationId,
      context.session.data.id,
      context
    );

    return {
      notification,
      message: 'Notification marked as read',
    };
  } catch (error: any) {
    console.error('Mark as read mutation error:', error);
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError('Failed to mark notification as read', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
