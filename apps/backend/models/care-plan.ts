import { list } from '@keystone-6/core';
// import type { Lists } from '.keystone/types';
import { text, relationship, float, timestamp } from '@keystone-6/core/fields';

export const CarePlan = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: ({ session }) => !!session,
      delete: ({ session }) => !!session,
    },
  },
  fields: {
    name: text({ validation: { isRequired: true } }),
    progressScore: float({
      validation: { isRequired: false },
    }),
    lastAssessmentAt: timestamp({
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
    user: relationship({ ref: 'User.carePlan' }),
    questionnaires: relationship({
      ref: 'Questionnaire.carePlans',
      many: true,
    }),
    questionnaireResponses: relationship({
      ref: 'QuestionnaireResponse.carePlan',
      many: true,
    }),
  },
});
