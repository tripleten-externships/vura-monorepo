import { list } from '@keystone-6/core';
// import type { Lists } from '.keystone/types';
import { text, relationship, float, timestamp } from '@keystone-6/core/fields';
import { isAdmin, isLoggedIn, isAdminOrOwner } from '../utils/rbac';

export const CarePlan = list({
  access: {
    operation: {
      // Only logged-in users can view care plans
      query: ({ session }) => isLoggedIn(session),
      // Only logged-in users can create care plans
      create: ({ session }) => isLoggedIn(session),
      // Only logged-in users can update care plans
      update: ({ session }) => isLoggedIn(session),
      // Only admins can delete care plans
      delete: ({ session }) => isAdmin(session),
    },
    filter: {
      query: ({ session }) => {
        // Admins can see all care plans
        if (isAdmin(session)) return true;

        // Regular users can only see their own care plans
        if (isLoggedIn(session)) {
          return { user: { id: { equals: session.data.id } } };
        }

        // Not logged in = can't see anything
        return false;
      },
    },
    item: {
      // Users can only update their own care plans, admins can update any
      update: ({ session, item }) => isAdminOrOwner(session, item),
      // Only admins can delete any care plan
      delete: ({ session }) => isAdmin(session),
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
