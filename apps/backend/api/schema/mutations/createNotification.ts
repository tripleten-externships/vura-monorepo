import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import { notificationService } from '../../../services/notification';

export interface CreateNotificationInputGQL {
  userId: string;
  type: string;
  notificationType: string;
  priority?: string;
  content: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  relatedCarePlanId?: string;
  relatedChatId?: string;
  relatedForumPostId?: string;
}

export const customCreateNotification = async (
  _: any,
  { input }: { input: CreateNotificationInputGQL },
  context: Context
) => {
  try {
    if (!context.session?.data?.id) {
      throw new GraphQLError('User must be authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const notification = await notificationService.createNotification(
      {
        userId: input.userId,
        type: input.type,
        notificationType: input.notificationType as any,
        priority: input.priority as any,
        content: input.content,
        actionUrl: input.actionUrl,
        metadata: input.metadata,
        relatedCarePlanId: input.relatedCarePlanId,
        relatedChatId: input.relatedChatId,
        relatedForumPostId: input.relatedForumPostId,
      },
      context
    );

    return {
      notification,
      message: 'Notification created successfully',
    };
  } catch (error: any) {
    console.error('Create notification mutation error:', error);
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError('Failed to create notification', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
