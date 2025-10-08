import { list } from '@keystone-6/core';
// import type { Lists } from '.keystone/types';
import { text, timestamp, relationship, select, json } from '@keystone-6/core/fields';
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
  ui: {
    labelField: 'title',
    listView: {
      initialColumns: ['title', 'user', 'createdAt', 'updatedAt'],
    },
  },
});
