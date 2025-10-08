import { list } from '@keystone-6/core';
// import type { Lists } from '.keystone/types';
import { text, timestamp, relationship } from '@keystone-6/core/fields';
import { allowAll } from '@keystone-6/core/access';

export const CarePlan = list({
  access: {
    operation: {
      // anyone can query
      query: allowAll,
      // must be logged in
      create: ({ session }) => !!session?.data,
      update: ({ session }) => !!session,
      delete: ({ session }) => !!session,
    },
  },
  fields: {
    title: text({
      isIndexed: 'unique',
      validation: { isRequired: true },
    }),
    user: relationship({
      // users careplan list
      ref: 'User.carePlans',
      many: false,
    }),
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
      ui: { createView: { fieldMode: 'hidden' } },
    }),
    updatedAt: timestamp({
      // auto-update on save
      db: { updatedAt: true },
      ui: { createView: { fieldMode: 'hidden' } },
    }),
  },
  ui: {
    labelField: 'title',
    listView: {
      initialColumns: ['title', 'user', 'createdAt', 'updatedAt'],
    },
  },
});
