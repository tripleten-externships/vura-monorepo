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
import { isAdmin, isLoggedIn } from '../utils/rbac';

export const AiMessage = list({
  access: {
    operation: {
      // Only logged-in users can query AI messages
      query: ({ session }) => isLoggedIn(session),
      // Only logged-in users can create AI messages
      create: ({ session }) => isLoggedIn(session),
      // Only logged-in users can update AI messages
      update: ({ session }) => isLoggedIn(session),
      // Only logged-in users can delete AI messages
      delete: ({ session }) => isLoggedIn(session),
    },
    filter: {
      query: ({ session }) => {
        // Admins can see all messages
        if (isAdmin(session)) return true;

        // Users can only see messages from their own sessions
        if (isLoggedIn(session) && session?.data?.id) {
          return {
            session: {
              user: { id: { equals: session.data.id } },
            },
          };
        }

        // Not logged in = can't see anything
        return false;
      },
    },
    item: {
      // Conservative approach - only admins can update/delete AI messages
      // Users viewing their own messages are handled by filter.query
      update: ({ session }) => isAdmin(session),
      delete: ({ session }) => isAdmin(session),
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
