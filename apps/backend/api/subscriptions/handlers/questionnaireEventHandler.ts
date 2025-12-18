import { Context } from '../../../types/context';
import { SubscriptionTopics } from '../pubsub';
import { logger } from '../../../utils/logger';
import { QuestionnaireAssignedEvent, QuestionnaireCompletedEvent } from '../events';
import { notificationService } from '../../../services/notification';
import { EventBus } from '../eventBus';

const systemContext = { session: { data: { id: 'system' } } } as Context;

async function handleQuestionnaireAssigned(event: QuestionnaireAssignedEvent): Promise<void> {
  const { userId, questionnaireTitle, carePlanId } = event;
  const normalizedCarePlanId = carePlanId ?? undefined;

  if (!userId) {
    logger.warn('QuestionnaireAssigned event missing userId', { event });
    return;
  }

  try {
    await notificationService.createNotification(
      {
        userId,
        type: 'QUESTIONNAIRE_ASSIGNED',
        notificationType: 'CARE_PLAN',
        content: `A new questionnaire "${questionnaireTitle ?? 'Questionnaire'}" has been assigned to you.`,
        relatedCarePlanId: normalizedCarePlanId,
      },
      systemContext
    );
    logger.info('Notification emitted for questionnaire assignment', {
      userId,
      questionnaireTitle,
    });
  } catch (error) {
    logger.error('Error creating questionnaire assignment notification', {
      error,
      event,
    });
  }
}

async function handleQuestionnaireCompleted(event: QuestionnaireCompletedEvent): Promise<void> {
  const { userId, questionnaireTitle, carePlanId } = event;
  const normalizedCarePlanId = carePlanId ?? undefined;

  if (!userId) {
    logger.warn('QuestionnaireCompleted event missing userId', { event });
    return;
  }

  try {
    await notificationService.createNotification(
      {
        userId,
        type: 'QUESTIONNAIRE_COMPLETED',
        notificationType: 'CARE_PLAN',
        content: `You have completed the questionnaire "${questionnaireTitle ?? 'Questionnaire'}".`,
        relatedCarePlanId: normalizedCarePlanId,
      },
      systemContext
    );
    logger.info('Notification emitted for questionnaire completion', {
      userId,
      questionnaireTitle,
    });
  } catch (error) {
    logger.error('Error creating questionnaire completion notification', {
      error,
      event,
    });
  }
}

export function initializeQuestionnaireEventHandlers(eventBus: EventBus): void {
  eventBus.subscribe<QuestionnaireAssignedEvent>(
    SubscriptionTopics.QUESTIONNAIRE_ASSIGNED,
    (payload) => {
      handleQuestionnaireAssigned(payload).catch((error) => {
        logger.error('Error in questionnaire assigned handler', { error });
      });
    }
  );

  eventBus.subscribe<QuestionnaireCompletedEvent>(
    SubscriptionTopics.QUESTIONNAIRE_COMPLETED,
    (payload) => {
      handleQuestionnaireCompleted(payload).catch((error) => {
        logger.error('Error in questionnaire completed handler', { error });
      });
    }
  );

  logger.info('Questionnaire event handlers initialized');
}
