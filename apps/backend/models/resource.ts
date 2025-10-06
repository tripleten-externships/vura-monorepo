import { list } from '@keystone-6/core';
import { text, relationship } from '@keystone-6/core/fields';

export const Resource = list({
  db: { idField: { kind: 'autoincrement' } },
  fields: {
    link: text({ validation: { isRequired: true } }),
    content: text({ validation: { isRequired: true } }),
    checklist: relationship({ ref: 'Checklist.resources' }),
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
