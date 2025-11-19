import { list } from '@keystone-6/core';
import { text, integer, relationship, json, timestamp } from '@keystone-6/core/fields';
import { isAdmin, isLoggedIn, isAdminOrOwner } from '../utils/rbac';

export const Parent = list({
  access: {
    operation: {
      // Anyone can query parent data (consider restricting this later)
      query: () => true,
      // Only logged-in users can create parents
      create: ({ session }) => isLoggedIn(session),
      // Only logged-in users can update parents
      update: ({ session }) => isLoggedIn(session),
      // Only logged-in users can delete parents
      delete: ({ session }) => isLoggedIn(session),
    },
    filter: {
      query: ({ session }) => {
        // Admins can see all parents
        if (isAdmin(session)) return true;

        // Users can see their own parents
        if (isLoggedIn(session) && session?.data?.id) {
          return { user: { id: { equals: session.data.id } } };
        }

        // Not logged in = can't see anything
        return false;
      },
    },
    item: {
      // Users can update their own parents, admins can update any
      update: ({ session, item }) => isAdminOrOwner(session, item),
      // Users can delete their own parents, admins can delete any
      delete: ({ session, item }) => isAdminOrOwner(session, item),
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
