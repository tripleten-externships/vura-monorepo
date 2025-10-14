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

// Questionnaire Model
export const Questionnaire = list({
  access: {
    operation: {
      query: ({ session }) => !!session,
      create: ({ session }) => !!session?.data?.isAdmin,
      update: ({ session }) => !!session?.data?.isAdmin,
      delete: ({ session }) => !!session?.data?.isAdmin,
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
      query: ({ session }) => !!session,
      create: ({ session }) => !!session?.data?.isAdmin,
      update: ({ session }) => !!session?.data?.isAdmin,
      delete: ({ session }) => !!session?.data?.isAdmin,
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
      query: ({ session }) => !!session,
      create: ({ session }) => !!session,
      update: ({ session }) => !!session,
      delete: ({ session }) => !!session,
    },
    filter: {
      query: ({ session }) => ({
        user: { id: { equals: session?.data?.id } },
      }),
    },
    item: {
      update: ({ session, item }) => {
        if (!session?.data?.id) return false;
        return session.data.isAdmin || item.userId === session.data.id;
      },
      delete: ({ session, item }) => {
        if (!session?.data?.id) return false;
        return session.data.isAdmin || item.userId === session.data.id;
      },
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
      query: ({ session }) => !!session,
      create: ({ session }) => !!session,
      update: ({ session }) => !!session,
      delete: ({ session }) => !!session,
    },
    filter: {
      query: ({ session }) => ({
        questionnaireResponse: {
          user: { id: { equals: session?.data?.id } },
        },
      }),
    },
    item: {
      update: ({ session, item }) => {
        if (!session?.data?.id) return false;
        return session.data.isAdmin;
      },
      delete: ({ session, item }) => {
        if (!session?.data?.id) return false;
        return session.data.isAdmin;
      },
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
