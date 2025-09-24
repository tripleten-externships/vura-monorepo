import { list } from '@keystone-6/core';
// import type { Lists } from '.keystone/types';
import { text, relationship } from '@keystone-6/core/fields';

export const Parent = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: ({ session }) => !!session,
      delete: ({ session }) => !!session,
    },
  },
  fields: {
    name: text({ validation: { isRequired: true } }),
    user: relationship({ ref: 'User.parent' }),
  },
});
