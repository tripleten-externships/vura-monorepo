import { list } from '@keystone-6/core';
import {
  text,
  select,
  json,
  timestamp,
  relationship,
  checkbox,
  integer,
  float,
} from '@keystone-6/core/fields';
import { isAdmin, isLoggedIn, isAdminOrOwner } from '../utils/rbac';

// Questionnaire Model
export const Questionnaire = list({
  access: {
    operation: {
      // Only logged-in users can view questionnaires
      query: ({ session }) => isLoggedIn(session),
      // Only admins can create questionnaires
      create: ({ session }) => isAdmin(session),
      // Only admins can update questionnaires
      update: ({ session }) => isAdmin(session),
      // Only admins can delete questionnaires
      delete: ({ session }) => isAdmin(session),
    },
  },
  fields: {
    title: text({
      validation: { isRequired: true },
    }),
    description: text({
      validation: { isRequired: false },
    }),
    questionnaireType: select({
      type: 'enum',
      options: [
        { label: 'Care Plan Assessment', value: 'care_plan_assessment' },
        { label: 'Checklist Evaluation', value: 'checklist_evaluation' },
        { label: 'General Assessment', value: 'general_assessment' },
        { label: 'Progress Review', value: 'progress_review' },
      ],
      defaultValue: 'general_assessment',
      validation: { isRequired: true },
    }),
    category: text({
      validation: { isRequired: false },
    }),
    isActive: checkbox({
      defaultValue: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
    }),
    updatedAt: timestamp({
      defaultValue: { kind: 'now' },
      db: { updatedAt: true },
    }),

    // Relationships
    questions: relationship({
      ref: 'Question.questionnaire',
      many: true,
    }),
    responses: relationship({
      ref: 'QuestionnaireResponse.questionnaire',
      many: true,
    }),
    carePlans: relationship({
      ref: 'CarePlan.questionnaires',
      many: true,
    }),
    checklists: relationship({
      ref: 'Checklist.questionnaires',
      many: true,
    }),
  },
});

// Question Model
export const Question = list({
  access: {
    operation: {
      // Only logged-in users can view questions
      query: ({ session }) => isLoggedIn(session),
      // Only admins can create questions
      create: ({ session }) => isAdmin(session),
      // Only admins can update questions
      update: ({ session }) => isAdmin(session),
      // Only admins can delete questions
      delete: ({ session }) => isAdmin(session),
    },
  },
  fields: {
    questionText: text({
      validation: { isRequired: true },
    }),
    questionType: select({
      type: 'enum',
      options: [
        { label: 'Text', value: 'text' },
        { label: 'Multiple Choice', value: 'multiple_choice' },
        { label: 'Rating Scale', value: 'rating_scale' },
        { label: 'Boolean', value: 'boolean' },
        { label: 'Scale', value: 'scale' },
      ],
      defaultValue: 'text',
      validation: { isRequired: true },
    }),
    options: json({
      defaultValue: null,
    }),
    isRequired: checkbox({
      defaultValue: false,
    }),
    order: integer({
      defaultValue: 0,
    }),
    category: text({
      validation: { isRequired: false },
    }),
    minValue: integer({
      validation: { isRequired: false },
    }),
    maxValue: integer({
      validation: { isRequired: false },
    }),

    // Relationships
    questionnaire: relationship({
      ref: 'Questionnaire.questions',
      many: false,
    }),
    responses: relationship({
      ref: 'QuestionResponse.question',
      many: true,
    }),
  },
});

// QuestionnaireResponse Model
export const QuestionnaireResponse = list({
  access: {
    operation: {
      // Only logged-in users can query responses
      query: ({ session }) => isLoggedIn(session),
      // Only logged-in users can create responses
      create: ({ session }) => isLoggedIn(session),
      // Only logged-in users can update responses
      update: ({ session }) => isLoggedIn(session),
      // Only logged-in users can delete responses
      delete: ({ session }) => isLoggedIn(session),
    },
    filter: {
      query: ({ session }) => {
        // Admins can see all responses
        if (isAdmin(session)) return true;

        // Users can only see their own responses
        if (isLoggedIn(session) && session?.data?.id) {
          return { user: { id: { equals: session.data.id } } };
        }

        // Not logged in = can't see anything
        return false;
      },
    },
    item: {
      // Users can update their own responses, admins can update any
      update: ({ session, item }) => isAdminOrOwner(session, item),
      // Users can delete their own responses, admins can delete any
      delete: ({ session, item }) => isAdminOrOwner(session, item),
    },
  },
  fields: {
    status: select({
      type: 'enum',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Completed', value: 'completed' },
        { label: 'In Progress', value: 'in_progress' },
      ],
      defaultValue: 'draft',
      validation: { isRequired: true },
    }),
    progressScore: float({
      validation: { isRequired: false },
    }),
    completionPercentage: float({
      validation: { isRequired: false },
    }),
    startedAt: timestamp({
      defaultValue: { kind: 'now' },
    }),
    completedAt: timestamp({
      validation: { isRequired: false },
    }),
    lastSavedAt: timestamp({
      defaultValue: { kind: 'now' },
      db: { updatedAt: true },
    }),

    // Relationships
    user: relationship({
      ref: 'User.questionnaireResponses',
      many: false,
    }),
    questionnaire: relationship({
      ref: 'Questionnaire.responses',
      many: false,
    }),
    carePlan: relationship({
      ref: 'CarePlan.questionnaireResponses',
      many: false,
    }),
    checklist: relationship({
      ref: 'Checklist.questionnaireResponses',
      many: false,
    }),
    questionResponses: relationship({
      ref: 'QuestionResponse.questionnaireResponse',
      many: true,
    }),
  },
  hooks: {
    beforeOperation: async ({ operation, resolvedData, context }) => {
      if (operation === 'update' && resolvedData.status === 'completed') {
        resolvedData.completedAt = new Date();
      }
    },
  },
});

// QuestionResponse Model
export const QuestionResponse = list({
  access: {
    operation: {
      // Only logged-in users can query question responses
      query: ({ session }) => isLoggedIn(session),
      // Only logged-in users can create question responses
      create: ({ session }) => isLoggedIn(session),
      // Only logged-in users can update question responses
      update: ({ session }) => isLoggedIn(session),
      // Only logged-in users can delete question responses
      delete: ({ session }) => isLoggedIn(session),
    },
    filter: {
      query: ({ session }) => {
        // Admins can see all question responses
        if (isAdmin(session)) return true;

        // Users can only see responses for their own questionnaires
        if (isLoggedIn(session) && session?.data?.id) {
          return {
            questionnaireResponse: {
              user: { id: { equals: session.data.id } },
            },
          };
        }

        // Not logged in = can't see anything
        return false;
      },
    },
    item: {
      // Only admins can update question responses
      update: ({ session }) => isAdmin(session),
      // Only admins can delete question responses
      delete: ({ session }) => isAdmin(session),
    },
  },
  fields: {
    answer: json(),
    confidence: integer({
      validation: {
        isRequired: false,
        min: 1,
        max: 5,
      },
    }),
    notes: text({
      validation: { isRequired: false },
    }),
    answeredAt: timestamp({
      defaultValue: { kind: 'now' },
    }),
    updatedAt: timestamp({
      defaultValue: { kind: 'now' },
      db: { updatedAt: true },
    }),

    // Relationships
    question: relationship({
      ref: 'Question.responses',
      many: false,
    }),
    questionnaireResponse: relationship({
      ref: 'QuestionnaireResponse.questionResponses',
      many: false,
    }),
  },
});
