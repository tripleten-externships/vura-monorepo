import { list } from '@keystone-6/core';
import { text, timestamp, relationship } from '@keystone-6/core/fields';

export const ForumSubscription = list({
  access: {
    operation: {
      query: ({ session }) => !!session?.data?.id,
      create: ({ session }) => !!session?.data?.id,
      update: ({ session }) => !!session?.data?.id,
      delete: ({ session }) => !!session?.data?.id,
    },
    filter: {
      query: ({ session }) => {
        if (!session?.data?.id) return false;
        return { user: { id: { equals: session.data.id } } };
      },
    },
  },
  fields: {
    user: relationship({ ref: 'User.forumSubscriptions', many: false }),
    forumPost: relationship({ ref: 'ForumPost.subscribers', many: false }),
    topic: text({ validation: { isRequired: false, length: { max: 50 } } }),
    content: text(),
    subscribedAt: timestamp({ defaultValue: { kind: 'now' } }),
  },
});
