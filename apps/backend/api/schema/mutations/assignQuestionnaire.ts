import { Context } from '../../../types/context';
import { questionnaireEmitter } from '../../../services/questionnaire/questionnaire.emitter';

export const assignQuestionnaire = async (
  _: any,
  { input }: { input: AssignQuestionnaireInput },
  context: Context
): Promise<AssignQuestionnaireResult> => {
  const { session, prisma } = context;

  if (!session?.data?.id) {
    throw new Error('Not authenticated');
  }

  // Create a new record linking the questionnaire to a user/care plan
  const assignment = await prisma.questionnaireAssignment.create({
    data: {
      questionnaireId: input.questionnaireId,
      assignedToId: input.assignedToId,
      carePlanId: input.carePlanId,
      assignedById: session.data.id, // admin/provider assigning
      assignedAt: new Date(),
    },
    include: {
      questionnaire: true,
      assignedTo: true,
      carePlan: true,
    },
  });

  // Emit notification event
  questionnaireEmitter.emit('assigned', {
    id: assignment.id,
    data: {
      userId: input.assignedToId,
      title: assignment.questionnaire.title,
      carePlanId: input.carePlanId,
    },
  });

  return {
    success: true,
    message: `Questionnaire '${assignment.questionnaire.title}' assigned to user.`,
    assignment,
  };
};

// Types
export interface AssignQuestionnaireInput {
  questionnaireId: string;
  assignedToId: string;
  carePlanId?: string;
}

export interface AssignQuestionnaireResult {
  success: boolean;
  message: string;
  assignment: any;
}
