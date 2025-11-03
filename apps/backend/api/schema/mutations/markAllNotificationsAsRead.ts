import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import { notificationService } from '../../../services/notification';

export const customMarkAllNotificationsAsRead = async (_: any, __: any, context: Context) => {
  try {
    if (!context.session?.data?.id) {
      throw new GraphQLError('User must be authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const count = await notificationService.markAllAsRead(context.session.data.id, context);

    return {
      count,
      message: `Marked ${count} notifications as read`,
    };
  } catch (error: any) {
    console.error('Mark all as read mutation error:', error);
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError('Failed to mark all notifications as read', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
