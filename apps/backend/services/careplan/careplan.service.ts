import { GraphQLError } from 'graphql';
import { Context } from '../../types/context';
import { notificationService } from '../notification/notification.service';
import { logger } from '../../utils/logger';
import {
  ICarePlanService,
  CreateCarePlanInput,
  UpdateCarePlanInput,
  AssignQuestionnairesInput,
} from './types';

export class CarePlanService implements ICarePlanService {
  async createCarePlan(data: CreateCarePlanInput, context: Context): Promise<any> {
    try {
      const { session, prisma } = context;
      if (!session?.data?.id) {
        throw new GraphQLError('User must be authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const carePlan = await prisma.carePlan.create({
        data: {
          name: data.name,
          progressScore: data.progressScore || 0,
          userId: data.userId || session.data.id,
          metadata: {
            lastNotifiedMilestone: null,
          },
        },
      });

      await notificationService.createNotification(
        {
          userId: carePlan.userId!,
          type: 'care_plan_created',
          notificationType: 'CARE_PLAN',
          priority: 'HIGH',
          content: `Your care plan "${carePlan.name}" has been created`,
          actionUrl: `/care-plan/${carePlan.id}`,
        },
        context
      );

      logger.info('Care plan created with notification', { carePlanId: carePlan.id });
      return carePlan;
    } catch (error: any) {
      logger.error('Create care plan error: ', error);
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to create care plan', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  }

  async updateCarePlan(
    carePlanId: string,
    data: UpdateCarePlanInput,
    context: Context
  ): Promise<any> {
    try {
      // get session and prisma from context
      const { session, prisma } = context;

      if (!session?.data?.id) {
        throw new GraphQLError('User must be authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // fetch existing care plan
      const existingCarePlan = await prisma.carePlan.findUnique({
        where: { id: carePlanId },
      });

      if (!existingCarePlan) {
        throw new GraphQLError(`Care plan with ${carePlanId} not found`);
      }

      const isOwner = existingCarePlan.userId === session.data.id;
      const previousScore = existingCarePlan.progressScore || 0;

      // update care plan
      const updatedCarePlan = await prisma.db.carePlan.update({
        where: { id: carePlanId },
        data: {
          ...data,
          lastAssessmentAt:
            data.progressScore !== undefined ? new Date() : existingCarePlan.lastAssessmentAt,
        },
      });
      // check if update is by admin/provider (not the owner/creator)
      if (!isOwner && existingCarePlan.userId) {
        await notificationService.createNotification(
          {
            userId: existingCarePlan.userId,
            type: 'care_plan_updated_by_provider',
            notificationType: 'CARE_PLAN',
            priority: 'MEDIUM',
            content: '',
            actionUrl: `/care-plan/${updatedCarePlan.id}`,
            relatedCarePlanId: updatedCarePlan.id,
          },
          context
        );
      }
      // check for milestone notifications if progressScore changed
      if (data.progressScore !== undefined && data.progressScore !== previousScore) {
        await this.checkAndEmitMilestoneNotification(
          updatedCarePlan,
          previousScore,
          data.progressScore,
          context
        );
      }
      // return updatedCarePlan
      return updatedCarePlan;
    } catch (error: any) {
      logger.error('upate care plan error', error);
    }
  }

  async assignQuestionnaires(data: AssignQuestionnairesInput, context: Context): Promise<any> {
    try {
      const { session, prisma } = context;

      if (!session?.data?.id) {
        throw new GraphQLError('User must be authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // fetch care plan
      const carePlan = await prisma.carePlan.findUnique({
        where: { id: data.carePlanId },
        include: { questionnaires: true },
      });

      if (!carePlan) {
        throw new GraphQLError('Care plan not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // fetch questionnaires being assigned
      const questionnaires = await prisma.questionnaire.findMany({
        where: { id: { in: data.questionnaireIds } },
      });

      // update care plan with new questionnaires
      const updatedCarePlan = await prisma.carePlan.update({
        where: { id: data.carePlanId },
        data: {
          questionnaires: {
            connect: data.questionnaireIds.map((id) => ({ id })),
          },
        },
        include: { questionnaires: true },
      });

      // emit notifications for each newly assigned questionnaire
      if (carePlan.userId) {
        for (const questionnaire of questionnaires) {
          await notificationService.createNotification(
            {
              userId: carePlan.userId,
              type: 'questionnaire_assigned',
              notificationType: 'CARE_PLAN',
              priority: 'MEDIUM',
              content: `A new questionnaire "${questionnaire.title}" has been assigned to your care plan`,
              actionUrl: `/care-plans/${carePlan.id}/questionnaires/${questionnaire.id}`,
              relatedCarePlanId: carePlan.id,
              metadata: { questionnaireId: questionnaire.id },
            },
            context
          );
        }
      }

      logger.info('Questionnaires assigned to care plan', {
        carePlanId: data.carePlanId,
        count: questionnaires.length,
      });

      // return updatedCarePlan
      return updatedCarePlan;
    } catch (error: any) {
      logger.error('Assign questionnaires error:', error);
      if (error instanceof GraphQLError) throw error;
      throw new GraphQLError('Failed to assign questionnaires', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  }

  private async checkAndEmitMilestoneNotification(
    carePlan: any,
    previousScore: number,
    newScore: number,
    context: Context
  ): Promise<void> {
    const milestones = [25, 50, 75, 100];
    const metadata = carePlan.metadata || {};
    const lastNotifiedMilestone = metadata.lastNotifiedMilestone || 0;
    for (const milestone of milestones) {
      if (previousScore < milestone && newScore >= milestone && lastNotifiedMilestone < milestone) {
        if (carePlan.userId) {
          await notificationService.createNotification(
            {
              userId: carePlan.userId,
              type: 'care_plan_milestone',
              notificationType: 'CARE_PLAN',
              priority: milestone === 100 ? 'HIGH' : 'MEDIUM',
              content:
                milestone === 100
                  ? `Congratulations! You've completed your care plan "${carePlan.name}"!`
                  : `Great progress! You've reached ${milestone}% completion on your care plan "${carePlan.name}`,
              actionUrl: `/care-plan/${carePlan.id}`,
              relatedCarePlanId: carePlan.id,
              metadata: { milestone, progressScore: newScore },
            },
            context
          );

          await context.prisma.carePlan.update({
            where: { id: carePlan.id },
            data: {
              metadata: { ...metadata, lastNotifiedMilestone: milestone },
            },
          });

          logger.info('Milestone notification emitted', {
            carePlanId: carePlan.id,
            milestone,
          });
        }
        break; // only notify for one milestone at a time
      }
    }
  }
}

export const carePlanService = new CarePlanService();
