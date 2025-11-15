import { list } from '@keystone-6/core';
import { text, relationship, float, timestamp } from '@keystone-6/core/fields';
import { isAuthenticated, canAccessOwnData, isAdmin } from '../api/middlewares/auth';

export const CarePlan = list({
  access: {
    operation: {
      query: isAuthenticated, // only signed-in users can query
      create: isAuthenticated, // only signed-in users can create
      update: isAuthenticated, // only the owner or admin can update
      // update: ({ session }) => !!session?.data?.id,

      delete: isAuthenticated, // only the owner or admin can delete
      // create: ({ session }) => !!session?.data?.id,
    },
    filter: {
      query: ({ session }) => {
        if (!session?.data?.id) return false;
        // Admins can see all, regular users see only their own
        return isAdmin({ session }) ? true : { user: { id: { equals: session.data.id } } };
      },
    },
  },

  hooks: {
    resolveInput: async ({ operation, resolvedData, context }) => {
      if (operation === 'create' && context.session?.data?.id) {
        resolvedData.user = { connect: { id: context.session.data.id } };
      }
      return resolvedData;
    },
  },

  fields: {
    name: text({ validation: { isRequired: true } }),
    progressScore: float(),
    lastAssessmentAt: timestamp(),
    createdAt: timestamp({ defaultValue: { kind: 'now' } }),
    updatedAt: timestamp({ defaultValue: { kind: 'now' }, db: { updatedAt: true } }),

    // Relationships
    user: relationship({ ref: 'User.carePlan' }),
    questionnaires: relationship({ ref: 'Questionnaire.carePlans', many: true }),
    questionnaireResponses: relationship({ ref: 'QuestionnaireResponse.carePlan', many: true }),
  },
});
