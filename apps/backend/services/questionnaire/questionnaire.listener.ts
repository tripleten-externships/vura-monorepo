import { questionnaireEmitter } from './questionnaire.emitter';
import { notificationService } from '../notification';
import { Context } from '../../types/context';

//DEFINE CONSTANTS
export const QuestionnaireEvents = {
  ASSIGNED: 'assigned',
  COMPLETED: 'completed',
} as const;

// Create a sys context since notifications require a context object
const systemContext = { session: { data: { id: 'system' } } } as Context;

// Listener for assigned questionnaires
questionnaireEmitter.on(QuestionnaireEvents.ASSIGNED, async (payload) => {
  const { data } = payload;

  try {
    await notificationService.createNotification(
      {
        userId: data.userId, // whoever the questionnaire was assigned to
        type: 'QUESTIONNAIRE_ASSIGNED',
        notificationType: 'CARE_PLAN',
        content: `A new questionnaire "${data.title}" has been assigned to you.`,
        relatedCarePlanId: data.carePlanId,
      },
      systemContext
    );
    console.log(`Notification emitted for questionnaire assignment: ${data.title}`);
  } catch (err) {
    console.error('Error creating questionnaire assignment notification:', err);
  }
});

// Listener for completed questionnaires
questionnaireEmitter.on(QuestionnaireEvents.COMPLETED, async (payload) => {
  const { data } = payload;

  try {
    await notificationService.createNotification(
      {
        userId: data.userId, // the user who completed it
        type: 'QUESTIONNAIRE_COMPLETED',
        notificationType: 'CARE_PLAN',
        content: `You have completed the questionnaire "${data.questionnaire.title}".`,
        relatedCarePlanId: data.carePlanId,
      },
      systemContext
    );
    console.log(`Notification emitted for questionnaire completion: ${data.questionnaire.title}`);
  } catch (err) {
    console.error('Error creating questionnaire completion notification:', err);
  }
});
