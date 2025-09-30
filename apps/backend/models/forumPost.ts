import { list } from '@keystone-6/core';
import { text, timestamp, relationship } from '@keystone-6/core/fields';

export const ForumPost = list({
  access: {
    operation: {
      query: ({ session }) => !!session,
      create: ({ session }) => !!session,
      update: ({ session }) => !!session,
      delete: ({ session }) => !!session,
    },
    filter: {
      // only logged-in user can see posts
      query: ({ session }) => !!session?.data?.id,
    },
    item: {
      //only logged-in users can update and delete their own posts
      update: ({ session, item }) => {
        if (!session?.data?.id) return false;
        return session?.data?.id === item.authorId;
      },
      delete: ({ session, item }) => {
        if (!session?.data?.id) return false;
        return session?.data?.id === item.authorId;
      },
    },
  },
  fields: {
    //forumpost content
    title: text({
      validation: { isRequired: true, length: { max: 30 } },
    }),
    topic: text({
      validation: { isRequired: true, length: { max: 50 } },
    }),
    content: text({
      validation: { isRequired: true, length: { min: 10, max: 5000 } },
      ui: {
        displayMode: 'textarea',
      },
    }),
    //timestamp
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
    }),
    //timestamp
    updatedAt: timestamp({
      defaultValue: { kind: 'now' },
    }),
    //relationship
    author: relationship({
      ref: 'User.forumPost',
      many: false,
      ui: {
        displayMode: 'select',
      },
    }),
  },
  hooks: {
    //Automatically connect the author to the logged-in user and get their user ID.
    resolveInput: async ({ resolvedData, context }) => {
      if (context.session?.data?.id) {
        return {
          ...resolvedData,
          author: { connect: { id: context.session.data.id } },
        };
      }
      return resolvedData;
    },
    // Automatically update the time when a post is updated.
    beforeOperation: async ({ operation, resolvedData }) => {
      if (operation === 'update') {
        resolvedData.updatedAt = new Date();
      }
    },
    // Automatically delete when a post is deleted.
    afterOperation: async ({ operation, item }) => {
      if (operation === 'delete') {
        console.log('Deleted item:', item);
      }
    },
  },
});
