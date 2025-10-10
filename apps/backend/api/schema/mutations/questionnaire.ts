import { GraphQLError } from 'graphql';
import type { Context } from '../../../types/context';

// Input Types
interface SaveQuestionnaireResponseInput {
  questionnaireId: string;
  carePlanId?: string;
  checklistId?: string;
  responses: QuestionResponseInput[];
  isDraft?: boolean;
}

interface QuestionResponseInput {
  questionId: string;
  answer: any;
  confidence?: number;
  notes?: string;
}

interface SubmitQuestionnaireInput {
  questionnaireResponseId: string;
  updateCarePlanProgress?: boolean;
}

// Output Types
interface SaveQuestionnaireResponseResult {
  questionnaireResponseId: string;
  message: string;
  completionPercentage: number;
  carePlanUpdated: boolean;
  checklistUpdated: boolean;
}

interface SubmitQuestionnaireResult {
  questionnaireResponseId: string;
  message: string;
  completedAt: Date;
  carePlanProgressScore?: number;
  checklistCompletionScore?: number;
}

// Save Questionnaire Response Mutation
export const saveQuestionnaireResponse = async (
  _: any,
  { input }: { input: SaveQuestionnaireResponseInput },
  context: Context
): Promise<SaveQuestionnaireResponseResult> => {
  const { session, prisma } = context;

  // Validate authentication
  if (!session?.data?.id) {
    throw new GraphQLError('User must be authenticated to save responses', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  // Validate required fields
  if (!input.questionnaireId) {
    throw new GraphQLError('Questionnaire ID is required', {
      extensions: { code: 'VALIDATION_ERROR' },
    });
  }

  if (!input.responses || input.responses.length === 0) {
    throw new GraphQLError('Responses array cannot be empty', {
      extensions: { code: 'VALIDATION_ERROR' },
    });
  }

  try {
    // Verify questionnaire exists
    const questionnaire = await prisma.questionnaire.findUnique({
      where: { id: input.questionnaireId },
      include: { questions: true },
    });

    if (!questionnaire) {
      throw new GraphQLError('Questionnaire not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Validate care plan if provided
    let carePlan = null;
    if (input.carePlanId) {
      carePlan = await prisma.carePlan.findUnique({
        where: { id: input.carePlanId },
      });
      if (!carePlan) {
        throw new GraphQLError('Care plan not found or access denied', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
    }

    // Validate checklist if provided
    let checklist = null;
    if (input.checklistId) {
      checklist = await prisma.checklist.findUnique({
        where: { id: input.checklistId },
      });
      if (!checklist) {
        throw new GraphQLError('Checklist not found or access denied', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
    }

    // Validate question IDs belong to questionnaire
    const questionIds = questionnaire.questions.map((q: any) => q.id);
    const invalidQuestionIds = input.responses.filter((r) => !questionIds.includes(r.questionId));

    if (invalidQuestionIds.length > 0) {
      throw new GraphQLError('Invalid question ID', {
        extensions: { code: 'VALIDATION_ERROR' },
      });
    }

    // Validate required questions are answered
    const requiredQuestions = questionnaire.questions.filter((q: any) => q.isRequired);
    const answeredQuestionIds = input.responses.map((r) => r.questionId);
    const missingRequiredQuestions = requiredQuestions.filter(
      (q: any) => !answeredQuestionIds.includes(q.id)
    );

    if (missingRequiredQuestions.length > 0 && !input.isDraft) {
      throw new GraphQLError('Answer is required for required questions', {
        extensions: { code: 'VALIDATION_ERROR' },
      });
    }

    // Validate confidence scores
    const invalidConfidenceScores = input.responses.filter(
      (r) => r.confidence && (r.confidence < 1 || r.confidence > 5)
    );

    if (invalidConfidenceScores.length > 0) {
      throw new GraphQLError('Invalid confidence score', {
        extensions: { code: 'VALIDATION_ERROR' },
      });
    }

    // Check for existing questionnaire response
    let questionnaireResponse = await prisma.questionnaireResponse.findFirst({
      where: {
        userId: session.data.id,
        questionnaireId: input.questionnaireId,
        carePlanId: input.carePlanId || null,
        checklistId: input.checklistId || null,
      },
      include: { questionResponses: true },
    });

    // Calculate completion percentage
    const totalQuestions = questionnaire.questions.length;
    const answeredQuestions = input.responses.length;
    const completionPercentage = (answeredQuestions / totalQuestions) * 100;

    // Update or create questionnaire response
    if (questionnaireResponse) {
      // Update existing response
      questionnaireResponse = await prisma.questionnaireResponse.update({
        where: { id: questionnaireResponse.id },
        data: {
          status: input.isDraft ? 'draft' : 'in_progress',
          completionPercentage,
          lastSavedAt: new Date(),
        },
        include: { questionResponses: true },
      });

      // Update existing question responses
      for (const response of input.responses) {
        const existingResponse = questionnaireResponse.questionResponses.find(
          (qr: any) => qr.questionId === response.questionId
        );

        if (existingResponse) {
          await prisma.questionResponse.update({
            where: { id: existingResponse.id },
            data: {
              answer: response.answer,
              confidence: response.confidence,
              notes: response.notes,
              updatedAt: new Date(),
            },
          });
        } else {
          await prisma.questionResponse.create({
            data: {
              questionId: response.questionId,
              questionnaireResponseId: questionnaireResponse.id,
              answer: response.answer,
              confidence: response.confidence,
              notes: response.notes,
            },
          });
        }
      }
    } else {
      // Create new questionnaire response
      questionnaireResponse = await prisma.questionnaireResponse.create({
        data: {
          userId: session.data.id,
          questionnaireId: input.questionnaireId,
          carePlanId: input.carePlanId,
          checklistId: input.checklistId,
          status: input.isDraft ? 'draft' : 'in_progress',
          completionPercentage,
          startedAt: new Date(),
          lastSavedAt: new Date(),
          questionResponses: {
            create: input.responses.map((response) => ({
              questionId: response.questionId,
              answer: response.answer,
              confidence: response.confidence,
              notes: response.notes,
            })),
          },
        },
        include: { questionResponses: true },
      });
    }

    // Update care plan progress if applicable
    let carePlanUpdated = false;
    if (carePlan && !input.isDraft) {
      await prisma.carePlan.update({
        where: { id: carePlan.id },
        data: {
          progressScore: completionPercentage,
          lastAssessmentAt: new Date(),
        },
      });
      carePlanUpdated = true;
    }

    // Update checklist completion if applicable
    let checklistUpdated = false;
    if (checklist && !input.isDraft) {
      await prisma.checklist.update({
        where: { id: checklist.id },
        data: {
          completionScore: completionPercentage,
        },
      });
      checklistUpdated = true;
    }

    return {
      questionnaireResponseId: questionnaireResponse.id,
      message: input.isDraft
        ? 'Questionnaire responses saved as draft'
        : 'Questionnaire responses saved successfully',
      completionPercentage,
      carePlanUpdated,
      checklistUpdated,
    };
  } catch (error) {
    if (error instanceof GraphQLError) {
      throw error;
    }

    console.error('Error saving questionnaire response:', error);
    throw new GraphQLError('Failed to save questionnaire responses', {
      extensions: { code: 'INTERNAL_ERROR' },
    });
  }
};

// Submit Questionnaire Mutation
export const submitQuestionnaire = async (
  _: any,
  { input }: { input: SubmitQuestionnaireInput },
  context: Context
): Promise<SubmitQuestionnaireResult> => {
  const { session, prisma } = context;

  // Validate authentication
  if (!session?.data?.id) {
    throw new GraphQLError('User must be authenticated to submit responses', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  // Validate required fields
  if (!input.questionnaireResponseId) {
    throw new GraphQLError('Questionnaire response ID is required', {
      extensions: { code: 'VALIDATION_ERROR' },
    });
  }

  try {
    // Find questionnaire response
    const questionnaireResponse = await prisma.questionnaireResponse.findUnique({
      where: { id: input.questionnaireResponseId },
      include: {
        questionnaire: {
          include: { questions: true },
        },
        questionResponses: true,
        carePlan: true,
        checklist: true,
      },
    });

    if (!questionnaireResponse) {
      throw new GraphQLError('Questionnaire response not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check ownership
    if (questionnaireResponse.userId !== session.data.id && !session.data.isAdmin) {
      throw new GraphQLError('You can only submit your own responses', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // Check if already submitted
    if (questionnaireResponse.status === 'completed') {
      throw new GraphQLError('Questionnaire already submitted', {
        extensions: { code: 'VALIDATION_ERROR' },
      });
    }

    // Validate all required questions are answered
    const requiredQuestions = questionnaireResponse.questionnaire.questions.filter(
      (q: any) => q.isRequired
    );
    const answeredQuestionIds = questionnaireResponse.questionResponses.map(
      (qr: any) => qr.questionId
    );
    const missingRequiredQuestions = requiredQuestions.filter(
      (q: any) => !answeredQuestionIds.includes(q.id)
    );

    if (missingRequiredQuestions.length > 0) {
      throw new GraphQLError('All required questions must be answered', {
        extensions: { code: 'VALIDATION_ERROR' },
      });
    }

    // Calculate final scores
    const totalQuestions = questionnaireResponse.questionnaire.questions.length;
    const answeredQuestions = questionnaireResponse.questionResponses.length;
    const completionPercentage = (answeredQuestions / totalQuestions) * 100;

    // Update questionnaire response to completed
    const updatedResponse = await prisma.questionnaireResponse.update({
      where: { id: questionnaireResponse.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        progressScore: completionPercentage,
        completionPercentage: 100,
      },
      include: {
        questionnaire: true,
        questionResponses: {
          include: { question: true },
        },
        carePlan: true,
        checklist: true,
      },
    });

    // Update care plan progress if requested and applicable
    let carePlanProgressScore: number | undefined;
    if (input.updateCarePlanProgress && questionnaireResponse.carePlan) {
      try {
        await prisma.carePlan.update({
          where: { id: questionnaireResponse.carePlan.id },
          data: {
            progressScore: completionPercentage,
            lastAssessmentAt: new Date(),
          },
        });
        carePlanProgressScore = completionPercentage;
      } catch (error) {
        console.error('Failed to update care plan progress:', error);
        throw new GraphQLError('Failed to update care plan progress', {
          extensions: { code: 'INTERNAL_ERROR' },
        });
      }
    }

    // Update checklist completion if applicable
    let checklistCompletionScore: number | undefined;
    if (questionnaireResponse.checklist) {
      try {
        await prisma.checklist.update({
          where: { id: questionnaireResponse.checklist.id },
          data: {
            completionScore: completionPercentage,
          },
        });
        checklistCompletionScore = completionPercentage;
      } catch (error) {
        console.error('Failed to update checklist completion:', error);
        // Don't throw error for checklist updates as they're not critical
      }
    }

    return {
      questionnaireResponseId: updatedResponse.id,
      message: 'Questionnaire submitted successfully',
      completedAt: updatedResponse.completedAt!,
      carePlanProgressScore,
      checklistCompletionScore,
    };
  } catch (error) {
    if (error instanceof GraphQLError) {
      throw error;
    }

    console.error('Error submitting questionnaire:', error);
    throw new GraphQLError('Failed to submit questionnaire', {
      extensions: { code: 'INTERNAL_ERROR' },
    });
  }
};
