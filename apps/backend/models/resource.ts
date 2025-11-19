import { list } from '@keystone-6/core';
import { text, relationship } from '@keystone-6/core/fields';
import { isAdmin } from '../utils/rbac';

export const Resource = list({
  db: { idField: { kind: 'autoincrement' } },
  fields: {
    link: text({ validation: { isRequired: true } }),
    content: text({ validation: { isRequired: true } }),
    checklist: relationship({ ref: 'Checklist.resources' }),
  },
  access: {
    operation: {
      // Anyone can view resources (public)
      query: () => true,
      // Only admins can create resources
      create: ({ session }) => isAdmin(session),
      // Only admins can update resources
      update: ({ session }) => isAdmin(session),
      // Only admins can delete resources
      delete: ({ session }) => isAdmin(session),
    },
  },
});
