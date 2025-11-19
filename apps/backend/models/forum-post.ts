import { list } from '@keystone-6/core';
import { text, timestamp, relationship } from '@keystone-6/core/fields';
import { isAdmin, isLoggedIn, isAdminOrOwner } from '../utils/rbac';

export const ForumPost = list({
  access: {
    operation: {
      // Only logged-in users can view forum posts
      query: ({ session }) => isLoggedIn(session),
      // Only logged-in users can create forum posts
      create: ({ session }) => isLoggedIn(session),
      // Only logged-in users can update forum posts
      update: ({ session }) => isLoggedIn(session),
      // Only admins can delete any post, or users can delete their own
      delete: ({ session }) => isLoggedIn(session),
    },
    filter: {
      // Only logged-in users can see posts
      query: ({ session }) => {
        if (!isLoggedIn(session)) return false;
        // All logged-in users can see all posts
        return true;
      },
    },
    item: {
      // Users can update their own posts, admins can update any
      update: ({ session, item }) => isAdminOrOwner(session, item),
      // Users can delete their own posts, admins can delete any
      delete: ({ session, item }) => isAdminOrOwner(session, item),
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
