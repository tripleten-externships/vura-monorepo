import { User } from './user';

import { list } from '@keystone-6/core';
import { text, integer, relationship, json, timestamp } from '@keystone-6/core/fields';

export const Parent = list({
  //only logged in users can create, update, and delete
  access: {
    operation: {
      query: () => true, //anyone can query parent data
      create: ({ session }) => !!session,
      update: ({ session }) => !!session,
      delete: ({ session }) => !!session,
    },
    filter: {
      query: ({ session }) =>
        session?.data.isAdmin ? true : { user: { id: { equals: session?.data.id } } }, //allows users to see their own parents
    },
    item: {
      //Allows updates/deletes if user is admin or own parent
      update: ({ session, item }) => session?.data.isAdmin || item.userId === session?.data.id,
      delete: ({ session, item }) => session?.data.isAdmin || item.userId === session?.data.id,
    },
  },
  //auto incrementing id
  db: { idField: { kind: 'autoincrement' } },

  fields: {
    name: text({
      validation: { isRequired: true },
    }),
    age: integer({
      validation: { isRequired: true, min: 0 },
    }),

    relationship: text({
      validation: { isRequired: true },
    }),
    health_conditions: json(),

    created_at: timestamp({
      defaultValue: { kind: 'now' },
    }),
    updated_at: timestamp({
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
      //Make sure parent is always linked to a user
      if (!resolvedData.user) {
        addValidationError('Parent must be linked to a User.');
      }
    },
  },
});
