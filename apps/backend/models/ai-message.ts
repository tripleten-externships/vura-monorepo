import { list } from '@keystone-6/core';
import type { Lists } from '.keystone/types';
import {
  text,
  select,
  json,
  timestamp,
  relationship,
  integer,
  float,
} from '@keystone-6/core/fields';

export const AiMessage = list({
  access: {
    operation: {
      query: ({ session }) => !!session,
      create: ({ session }) => !!session,
      update: ({ session }) => !!session,
      delete: ({ session }) => !!session,
    },
    filter: {
      query: ({ session }) => {
        if (!session?.data?.id) return false;

        // admin can see all messages, users can only see messages from their own sessions
        if (session.data.isAdmin) return true;

        return {
          session: {
            user: { id: { equals: session.data.id } },
          },
        };
      },
    },
    item: {
      // admin can update/delete any message, or user can update/delete messages from their own sessions
      // for non-admin users, check if the message belongs to their session
      // this would require a database query in a real implementation
      // conservative approach - only allow admin updates/deletes for now
      update: ({ session, item, context }) => {
        if (!session?.data?.id) return false;
        if (session.data.isAdmin) return true;

        return false;
      },
      delete: ({ session, item, context }) => {
        if (!session?.data?.id) return false;
        if (session.data.isAdmin) return true;

        return false;
      },
    },
  },
  fields: {
    // core message content
    content: text({
      validation: { isRequired: true },
      ui: {
        displayMode: 'textarea',
      },
    }),

    // message author (user, assistant, system, etc)
    author: select({
      type: 'enum',
      options: [
        { label: 'User', value: 'user' },
        { label: 'Assistant', value: 'assistant' },
        { label: 'System', value: 'system' },
        { label: 'Tool', value: 'tool' },
      ],
      validation: { isRequired: true },
    }),

    // ai model used to generate this message
    model: text({
      validation: { isRequired: false },
    }),

    // timestamps
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
    }),

    // ai generation parameters
    temperature: float({
      validation: {
        isRequired: false,
        min: 0,
        max: 2,
      },
    }),

    // performance metrics
    latencyMs: integer({
      validation: { isRequired: false, min: 0 },
      label: 'Latency (ms)',
    }),

    // token usage tracking
    promptTokens: integer({
      validation: { isRequired: false, min: 0 },
      label: 'Prompt Tokens',
    }),

    completionTokens: integer({
      validation: { isRequired: false, min: 0 },
      label: 'Completion Tokens',
    }),

    totalTokens: integer({
      validation: { isRequired: false, min: 0 },
      label: 'Total Tokens',
    }),

    // tool usage fields
    toolName: text({
      validation: { isRequired: false },
      label: 'Tool Name',
    }),

    toolArgs: json({
      label: 'Tool Arguments',
    }),

    toolResult: json({
      label: 'Tool Result',
    }),

    error: json({
      label: 'Error Details',
    }),

    // relationships
    session: relationship({
      ref: 'AiChatSession.messages',
      many: false,
      ui: {
        displayMode: 'select',
      },
    }),

    // self-referencing relationship for threaded conversations
    parentMessage: relationship({
      ref: 'AiMessage.childMessages',
      many: false,
      ui: {
        displayMode: 'select',
      },
    }),

    childMessages: relationship({
      ref: 'AiMessage.parentMessage',
      many: true,
    }),
  },

  // note: session lastActiveAt will be updated via the AiChatSession model hooks
});
