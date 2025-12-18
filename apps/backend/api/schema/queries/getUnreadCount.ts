import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import { notificationService } from '../../../services/notification';

export const customGetUnreadCount = async (
  _: any,
  { notificationType }: { notificationType?: string },
  context: Context
) => {
  try {
    // if (!context.session?.data?.id) {
    //   throw new GraphQLError('User must be authenticated', {
    //     extensions: { code: 'UNAUTHENTICATED' },
    //   });
    // }

    let count: number;

    if (notificationType) {
      count = await notificationService.getUnreadCountByType(
        context.session.data.id,
        notificationType as any,
        context
      );
    } else {
      count = await notificationService.getUnreadCount(context.session.data.id, context);
    }

    return {
      count,
      notificationType,
    };
  } catch (error: any) {
    console.error('Get unread count query error:', error);
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError('Failed to get unread count', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
