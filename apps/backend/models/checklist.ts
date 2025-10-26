import { list } from '@keystone-6/core';
import { text, relationship, float, timestamp } from '@keystone-6/core/fields';

export const Checklist = list({
  fields: {
    name: text({ validation: { isRequired: true } }),
    completionScore: float({
      validation: { isRequired: false },
    }),
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
    }),
    updatedAt: timestamp({
      defaultValue: { kind: 'now' },
      db: { updatedAt: true },
    }),

    // Relationships
    resources: relationship({ ref: 'Resource.checklist', many: true }),
    questionnaires: relationship({
      ref: 'Questionnaire.checklists',
      many: true,
    }),
    questionnaireResponses: relationship({
      ref: 'QuestionnaireResponse.checklist',
      many: true,
    }),
  },
  access: {
    operation: {
      query: () => true,
      create: ({ session }) => !!session,
      update: ({ session }) => !!session,
      delete: ({ session }) => !!session,
    },
  },
});
