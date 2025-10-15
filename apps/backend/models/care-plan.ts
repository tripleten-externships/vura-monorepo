import { list } from '@keystone-6/core';
// import type { Lists } from '.keystone/types';
import { text, relationship, float, timestamp } from '@keystone-6/core/fields';

export const CarePlan = list({
  access: {
    operation: {
      query: () => true,
      create: ({ session }) => !!session,
      update: ({ session }) => !!session,
      delete: ({ session }) => !!session,
    },
    filter: {
      update: ({ session }) => ({ user: { id: { equals: session?.itemId } } }),
      delete: ({ session }) => ({ user: { id: { equals: session?.itemId } } }),
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
    user: relationship({
      ref: 'User.carePlan',
      hooks: {
        resolveInput: ({ operation, resolvedData, context }) => {
          if (operation === 'create' && !resolvedData.user && context.session) {
            return { connect: { id: context.session.itemId } };
          }
          return resolvedData.user;
        },
      },
    }),
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
