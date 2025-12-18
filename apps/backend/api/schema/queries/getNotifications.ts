import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import { notificationService } from '../../../services/notification';

export interface GetNotificationsInput {
  read?: boolean;
  notificationType?: string;
  priority?: string;
  take?: number;
  skip?: number;
}

export const customGetNotifications = async (
  _: any,
  { input }: { input?: GetNotificationsInput },
  context: Context
) => {
  try {
    // if (!context.session?.data?.id) {
    //   throw new GraphQLError('User must be authenticated', {
    //     extensions: { code: 'UNAUTHENTICATED' },
    //   });
    // }

    const result = await notificationService.getNotifications(
      context.session.data.id,
      {
        read: input?.read,
        notificationType: input?.notificationType as any,
        priority: input?.priority as any,
        take: input?.take,
        skip: input?.skip,
      },
      context
    );

    return result;
  } catch (error: any) {
    console.error('Get notifications query error:', error);
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError('Failed to get notifications', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
