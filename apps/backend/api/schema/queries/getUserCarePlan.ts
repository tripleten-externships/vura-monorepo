import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';

export interface GetUserCarePlanInput {
  carePlanId?: string;
  includeArchived?: boolean;
  detailLevel?: 'SUMMARY' | 'DETAILED' | 'FULL';
  includeProgress?: boolean;
  includeResources?: boolean;
  includeQuestionnaireData?: boolean;
}

export const getUserCarePlan = async (
  _: any,
  { input = {} }: { input?: GetUserCarePlanInput },
  context: Context
) => {
  // Authentication check
  if (!context.session) {
    throw new GraphQLError('User must be authenticated to view care plans', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  const userId = context.session.itemId;
  const {
    carePlanId,
    includeArchived = false,
    detailLevel = 'DETAILED',
    includeProgress = true,
    includeResources = false,
    includeQuestionnaireData = false,
  } = input;

  try {
    // Build where clause
    const where: any = {
      user: { id: { equals: userId } },
    };

    // If specific carePlanId requested
    if (carePlanId) {
      where.id = { equals: carePlanId };
    }

    // Filter archived unless requested
    if (!includeArchived) {
      where.status = { not: { equals: 'archived' } };
    }

    // Build query based on detail level
    let queryFields = 'id title status createdAt updatedAt';

    if (detailLevel === 'DETAILED' || detailLevel === 'FULL') {
      queryFields += ' description goals activities timeline';
    }

    if (detailLevel === 'FULL') {
      queryFields += ' carePlanType parentGuidance aiGenerationMetadata';
    }

    if (includeResources) {
      queryFields += ' resources { id title link content }';
    }

    if (includeQuestionnaireData) {
      queryFields += ' questionnaireResponses { id status completedAt }';
    }

    // Add user relationship
    queryFields += ' user { id name }';

    // Fetch care plans
    const carePlans = await context.query.CarePlan.findMany({
      where,
      query: queryFields,
    });

    if (!carePlans || carePlans.length === 0) {
      if (carePlanId) {
        throw new GraphQLError('Care plan not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      return {
        carePlans: [],
        activeCarePlan: null,
        totalCount: 0,
        message: 'No care plans found for user',
      };
    }

    // Verify access if specific carePlanId
    if (carePlanId && carePlans[0]?.user?.id !== userId) {
      throw new GraphQLError('Access denied to care plan', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // Find active care plan
    const activeCarePlan = carePlans.find(
      (cp: any) => cp.status === 'active'
    ) || carePlans[0];

    // Add progress if requested
    if (includeProgress) {
      for (const plan of carePlans) {
        plan.progress = calculateProgress(plan);
      }
      if (activeCarePlan) {
        activeCarePlan.progress = calculateProgress(activeCarePlan);
      }
    }

    return {
      carePlans,
      activeCarePlan,
      totalCount: carePlans.length,
      message: 'Care plans retrieved successfully',
    };
  } catch (error) {
    if (error instanceof GraphQLError) {
      throw error;
    }
    console.error('Error fetching care plan:', error);
    throw new GraphQLError('Failed to fetch care plan data', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// Helper function for progress calculation
function calculateProgress(carePlan: any) {
  const goals = carePlan.goals || [];
  const milestones = carePlan.milestones || [];
  
  const goalsCompleted = goals.filter((g: any) => g.completed).length;
  const totalGoals = goals.length;
  const milestonesAchieved = milestones.filter((m: any) => m.status === 'COMPLETED').length;
  const totalMilestones = milestones.length;

  const overallProgress = totalGoals > 0 
    ? (goalsCompleted / totalGoals) * 100 
    : 0;

  const nextMilestone = milestones
    .filter((m: any) => m.status !== 'COMPLETED')
    .sort((a: any, b: any) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())[0];

  return {
    overallProgress: Math.round(overallProgress * 10) / 10,
    goalsCompleted,
    totalGoals,
    milestonesAchieved,
    totalMilestones,
    lastUpdated: new Date().toISOString(),
    nextMilestone: nextMilestone || null,
  };
}