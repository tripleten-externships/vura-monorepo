import { list } from '@keystone-6/core';
import { text, relationship } from '@keystone-6/core/fields';

export const Checklist = list({
  fields: {
    name: text({ validation: { isRequired: true } }),
    resources: relationship({ ref: 'Resource.checklist', many: true }),
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
