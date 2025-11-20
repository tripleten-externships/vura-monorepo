import { GraphQLError } from 'graphql';
import { BaseService, ServiceDependencies } from '../core';
import { questionnaireEmitter } from './questionnaire.emitter';
import {
  AssignQuestionnaireInput,
  AssignQuestionnaireResult,
  QuestionResponseInput,
  SaveQuestionnaireResponseInput,
  SaveQuestionnaireResponseResult,
  SubmitQuestionnaireInput,
  SubmitQuestionnaireResult,
} from './types';

const CONFIDENCE_MIN = 1;
const CONFIDENCE_MAX = 5;
const DEFAULT_COMPLETION = 0;

export class QuestionnaireService extends BaseService {
  constructor(deps: ServiceDependencies) {
    super(deps);
  }

  private requireUser() {
    const userId = this.context.session?.data?.id;
    if (!userId) {
      throw new GraphQLError('User must be authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }
    return userId;
  }

  async saveResponses(
    input: SaveQuestionnaireResponseInput
  ): Promise<SaveQuestionnaireResponseResult> {
    const userId = this.requireUser();

    if (!input.questionnaireId) {
      throw new GraphQLError('Questionnaire ID is required', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    if (!input.responses || input.responses.length === 0) {
      throw new GraphQLError('Responses array cannot be empty', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const prisma = this.context.prisma;

    try {
      const questionnaire = await prisma.questionnaire.findUnique({
        where: { id: input.questionnaireId },
        include: { questions: true },
      });

      if (!questionnaire) {
        throw new GraphQLError('Questionnaire not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const carePlan =
        input.carePlanId &&
        (await prisma.carePlan.findUnique({
          where: { id: input.carePlanId },
        }));

      if (input.carePlanId && !carePlan) {
        throw new GraphQLError('Care plan not found or access denied', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const checklist =
        input.checklistId &&
        (await prisma.checklist.findUnique({
          where: { id: input.checklistId },
        }));

      if (input.checklistId && !checklist) {
        throw new GraphQLError('Checklist not found or access denied', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      this.validateResponses(
        questionnaire.questions.length,
        questionnaire.questions,
        input.responses,
        input.isDraft
      );

      let questionnaireResponse = await prisma.questionnaireResponse.findFirst({
        where: {
          userId,
          questionnaireId: input.questionnaireId,
          carePlanId: input.carePlanId || null,
          checklistId: input.checklistId || null,
        },
        include: { questionResponses: true },
      });

      const completionPercentage = this.calculateCompletion(
        questionnaire.questions.length,
        input.responses.length
      );

      if (questionnaireResponse) {
        questionnaireResponse = await prisma.questionnaireResponse.update({
          where: { id: questionnaireResponse.id },
          data: {
            status: input.isDraft ? 'draft' : 'in_progress',
            completionPercentage,
            lastSavedAt: new Date(),
          },
          include: { questionResponses: true },
        });

        await this.persistResponses(
          questionnaireResponse.id,
          questionnaireResponse.questionResponses,
          input.responses
        );
      } else {
        questionnaireResponse = await prisma.questionnaireResponse.create({
          data: {
            userId,
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

      questionnaireEmitter.emit('assigned', {
        id: questionnaireResponse.id,
        data: questionnaireResponse,
      });

      const carePlanUpdated =
        Boolean(carePlan && !input.isDraft) &&
        (await prisma.carePlan
          .update({
            where: { id: carePlan!.id },
            data: {
              progressScore: completionPercentage,
              lastAssessmentAt: new Date(),
            },
          })
          .then(() => true));

      const checklistUpdated =
        Boolean(checklist && !input.isDraft) &&
        (await prisma.checklist
          .update({
            where: { id: checklist!.id },
            data: {
              completionScore: completionPercentage,
            },
          })
          .then(() => true));

      return {
        questionnaireResponseId: questionnaireResponse.id,
        message: input.isDraft
          ? 'Questionnaire responses saved as draft'
          : 'Questionnaire responses saved successfully',
        completionPercentage,
        carePlanUpdated: Boolean(carePlanUpdated),
        checklistUpdated: Boolean(checklistUpdated),
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
  }

  async submitResponse(input: SubmitQuestionnaireInput): Promise<SubmitQuestionnaireResult> {
    const userId = this.requireUser();

    if (!input.questionnaireResponseId) {
      throw new GraphQLError('Questionnaire response ID is required', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const prisma = this.context.prisma;

    try {
      const questionnaireResponse = await prisma.questionnaireResponse.findUnique({
        where: { id: input.questionnaireResponseId },
        include: {
          questionnaire: { include: { questions: true } },
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

      if (questionnaireResponse.userId !== userId && !this.context.session?.data?.isAdmin) {
        throw new GraphQLError('You can only submit your own responses', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (questionnaireResponse.status === 'completed') {
        throw new GraphQLError('Questionnaire already submitted', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      this.ensureRequiredResponsesAnswered(
        questionnaireResponse.questionnaire.questions,
        questionnaireResponse.questionResponses
      );

      const completionPercentage = this.calculateCompletion(
        questionnaireResponse.questionnaire.questions.length,
        questionnaireResponse.questionResponses.length
      );

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
          questionResponses: { include: { question: true } },
          carePlan: true,
          checklist: true,
        },
      });

      questionnaireEmitter.emit('completed', {
        id: updatedResponse.id,
        data: updatedResponse,
      });

      const carePlanProgressScore =
        input.updateCarePlanProgress && questionnaireResponse.carePlan
          ? await prisma.carePlan
              .update({
                where: { id: questionnaireResponse.carePlan.id },
                data: {
                  progressScore: completionPercentage,
                  lastAssessmentAt: new Date(),
                },
              })
              .then(() => completionPercentage)
          : undefined;

      const checklistCompletionScore = questionnaireResponse.checklist
        ? await prisma.checklist
            .update({
              where: { id: questionnaireResponse.checklist.id },
              data: {
                completionScore: completionPercentage,
              },
            })
            .then(() => completionPercentage)
            .catch((error) => {
              console.error('Failed to update checklist completion:', error);
              return undefined;
            })
        : undefined;

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
  }

  async assignQuestionnaire(input: AssignQuestionnaireInput): Promise<AssignQuestionnaireResult> {
    const assignedById = this.requireUser();

    if (!input.questionnaireId || !input.assignedToId) {
      throw new GraphQLError('questionnaireId and assignedToId are required', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const assignment = await this.context.prisma.questionnaireAssignment.create({
      data: {
        questionnaireId: input.questionnaireId,
        assignedToId: input.assignedToId,
        carePlanId: input.carePlanId,
        assignedById,
        assignedAt: new Date(),
      },
      include: {
        questionnaire: true,
        assignedTo: true,
        carePlan: true,
      },
    });

    questionnaireEmitter.emit('assigned', {
      id: assignment.id,
      data: {
        userId: input.assignedToId,
        title: assignment.questionnaire?.title,
        carePlanId: input.carePlanId,
      },
    });

    return {
      success: true,
      message: `Questionnaire '${assignment.questionnaire?.title ?? ''}' assigned to user.`,
      assignment,
    };
  }

  private validateResponses(
    totalQuestions: number,
    questionnaireQuestions: any[],
    responses: QuestionResponseInput[],
    isDraft?: boolean
  ) {
    if (totalQuestions === 0) {
      throw new GraphQLError('Questionnaire has no questions', {
        extensions: { code: 'VALIDATION_ERROR' },
      });
    }

    const questionIds = questionnaireQuestions.map((q) => q.id);
    const invalidQuestionIds = responses.filter((r) => !questionIds.includes(r.questionId));
    if (invalidQuestionIds.length > 0) {
      throw new GraphQLError('Invalid question ID', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const requiredQuestions = questionnaireQuestions.filter((q) => q.isRequired);
    const answeredQuestionIds = responses.map((r) => r.questionId);
    const missingRequiredQuestions = requiredQuestions.filter(
      (q) => !answeredQuestionIds.includes(q.id)
    );

    if (missingRequiredQuestions.length > 0 && !isDraft) {
      throw new GraphQLError('Answer is required for required questions', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const invalidConfidence = responses.filter(
      (response) =>
        response.confidence &&
        (response.confidence < CONFIDENCE_MIN || response.confidence > CONFIDENCE_MAX)
    );
    if (invalidConfidence.length > 0) {
      throw new GraphQLError('Invalid confidence score', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
  }

  private async persistResponses(
    questionnaireResponseId: string,
    existingResponses: any[],
    incomingResponses: QuestionResponseInput[]
  ) {
    for (const response of incomingResponses) {
      const existing = existingResponses.find((qr: any) => qr.questionId === response.questionId);
      if (existing) {
        await this.context.prisma.questionResponse.update({
          where: { id: existing.id },
          data: {
            answer: response.answer,
            confidence: response.confidence,
            notes: response.notes,
            updatedAt: new Date(),
          },
        });
      } else {
        await this.context.prisma.questionResponse.create({
          data: {
            questionId: response.questionId,
            questionnaireResponseId,
            answer: response.answer,
            confidence: response.confidence,
            notes: response.notes,
          },
        });
      }
    }
  }

  private ensureRequiredResponsesAnswered(questions: any[], responses: any[]) {
    const requiredQuestions = questions.filter((q) => q.isRequired);
    const answeredQuestionIds = responses.map((qr) => qr.questionId);
    const missingRequiredQuestions = requiredQuestions.filter(
      (q) => !answeredQuestionIds.includes(q.id)
    );

    if (missingRequiredQuestions.length > 0) {
      throw new GraphQLError('All required questions must be answered', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
  }

  private calculateCompletion(totalQuestions: number, answeredQuestions: number) {
    if (totalQuestions === 0) {
      return DEFAULT_COMPLETION;
    }
    return (answeredQuestions / totalQuestions) * 100;
  }
}
