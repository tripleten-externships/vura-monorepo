import { list } from '@keystone-6/core';
import { text, integer, relationship, json, timestamp } from '@keystone-6/core/fields';
import { isAuthenticated, canAccessOwnData, isAdmin } from '../utils/access'; // use your centralized helpers

export const Parent = list({
  access: {
    operation: {
      query: isAuthenticated, // only signed in users can query
      create: isAuthenticated, // only signed in users can create
      update: canAccessOwnData, // only owner or admin can update
      delete: canAccessOwnData, // only owner or admin can delete
    },
    filter: {
      query: ({ session }) => {
        if (!session?.data?.id) return false;
        // Admins can see all, users only see their linked parents
        return isAdmin({ session }) ? true : { user: { id: { equals: session.data.id } } };
      },
    },
  },

  db: { idField: { kind: 'autoincrement' } },

  fields: {
    name: text({ validation: { isRequired: true } }),

    age: integer({
      validation: { isRequired: true, min: 0 },
    }),

    relationship: text({ validation: { isRequired: true } }),

    healthConditions: json(),

    createdAt: timestamp({
      defaultValue: { kind: 'now' },
    }),

    updatedAt: timestamp({
      db: { updatedAt: true },
    }),

    user: relationship({
      ref: 'User.parents',
      many: false,
      ui: {
        displayMode: 'select',
        labelField: 'name',
      },
    }),
  },

  hooks: {
    validateInput: async ({ resolvedData, addValidationError }) => {
      if (!resolvedData.user) {
        addValidationError('Parent must be linked to a User.');
      }
    },
  },
});
