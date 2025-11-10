import { carePlanEmitter } from './careplan.service';
import { notificationService } from '../notification';
import { Context } from '../../types/context';

// You might want a way to get a system context, or pass one in from Keystone.
const systemContext = { session: { data: { id: 'system' } } } as Context;

carePlanEmitter.on('created', async (payload) => {
  const { data } = payload;
  try {
    await notificationService.createNotification(
      {
        userId: data.assignedToId, // or whoever should receive it
        type: 'CARE_PLAN_CREATED',
        notificationType: 'CARE_PLAN',
        content: `A new care plan "${data.title}" has been created for you.`,
        relatedCarePlanId: data.id,
      },
      systemContext
    );
  } catch (err) {
    console.error('Error creating care plan notification:', err);
  }
});

carePlanEmitter.on('updated', async (payload) => {
  const { data } = payload;
  try {
    await notificationService.createNotification(
      {
        userId: data.assignedToId,
        type: 'CARE_PLAN_UPDATED',
        notificationType: 'CARE_PLAN',
        content: `Your care plan "${data.title}" was updated.`,
        relatedCarePlanId: data.id,
      },
      systemContext
    );
  } catch (err) {
    console.error('Error creating care plan update notification:', err);
  }
});
