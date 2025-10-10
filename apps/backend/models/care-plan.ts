import { list } from '@keystone-6/core';
<<<<<<< HEAD
// import type { Lists } from '.keystone/types';
import { text, timestamp, relationship, select, json } from '@keystone-6/core/fields';
import { allowAll } from '@keystone-6/core/access';
=======
import { text, relationship, timestamp } from '@keystone-6/core/fields';
>>>>>>> 2b26efd (VURA-36 CarePlan model + schema)

export const CarePlan = list({
  access: {
    operation: {
      query: () => true,
      create: ({ session }) => !!session,
      update: ({ session }) => !!session,
      delete: ({ session }) => !!session,
    },
    filter: {
      update: ({ session }) => ({ user: { id: { equals: session?.itemId } } }),
      delete: ({ session }) => ({ user: { id: { equals: session?.itemId } } }),
    },
  },
  fields: {
    title: text({
      validation: { isRequired: true },
      isIndexed: 'unique',
      db: { isNullable: false },
    }),
<<<<<<< HEAD
    description: text({ 
      ui: { displayMode: 'textarea' } 
    }),
    status: select({
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Completed', value: 'completed' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'active',
    }),
    carePlanType: text(),
      goals: json(),
      activities: json(),
      timeline: json(),
      parentGuidance: text({ 
         ui: { displayMode: 'textarea' } 
    }),
    aiGenerationMetadata: json(),
      resources: json(),
       milestones: json(),
     user: relationship({
         ref: 'User.carePlan',
        many: false,
    }),
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
       db: { map: 'created_at' },
      ui: { createView: { fieldMode: 'hidden' } },
    }),
    updatedAt: timestamp({
      // auto-update on save
      db: {  map: 'updated_at', updatedAt: true },
      ui: { createView: { fieldMode: 'hidden' } },
=======
    user: relationship({
      ref: 'User.carePlans',
      hooks: {
        resolveInput: ({ operation, resolvedData, context }) => {
          if (operation === 'create' && !resolvedData.user && context.session) {
            return { connect: { id: context.session.itemId } };
          }
          return resolvedData.user;
        },
      },
    }),
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
      db: { map: 'created_at' },
    }),
    updatedAt: timestamp({
      db: { map: 'updated_at', updatedAt: true },
>>>>>>> 2b26efd (VURA-36 CarePlan model + schema)
    }),
    questionnaires: relationship({
      ref: 'Questionnaire.carePlans',
     many: true,
    }),
    questionnaireResponses: relationship({
      ref: 'QuestionnaireResponse.carePlan',
      many: true,
    }),
  },
});
