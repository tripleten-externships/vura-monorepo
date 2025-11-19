import { list } from '@keystone-6/core';
import { text, relationship, float, timestamp } from '@keystone-6/core/fields';
import { isAdmin, isLoggedIn } from '../utils/rbac';

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
      // Anyone can view checklists (public resource)
      query: () => true,
      // Only admins can create checklists
      create: ({ session }) => isAdmin(session),
      // Only admins can update checklists
      update: ({ session }) => isAdmin(session),
      // Only admins can delete checklists
      delete: ({ session }) => isAdmin(session),
    },
  },
});
