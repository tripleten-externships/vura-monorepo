import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import { aiService, ProviderType } from '../../../services/ai';
import { ChatMessage } from '../../../services/ai/types';

export interface AiChatInput {
  messages: Array<{ role: string; content: string }>;
  systemPrompt?: string;
  temperature?: number;
  provider?: string;
}

export const aiChat = async (_: any, { input }: { input: AiChatInput }, context: Context) => {
  try {
    const { messages, systemPrompt, temperature, provider } = input;

    if (!messages || !Array.isArray(messages)) {
      throw new GraphQLError('Messages array is required', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    // Validate message format
    if (messages.some((msg) => !msg.role || !msg.content)) {
      throw new GraphQLError('Each message must have role and content fields', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    // Validate roles match the expected values
    const validRoles = ['user', 'assistant', 'system'];
    const invalidRoleMessage = messages.find((msg) => !validRoles.includes(msg.role));
    if (invalidRoleMessage) {
      throw new GraphQLError(
        `Invalid message role: ${invalidRoleMessage.role}. Must be one of: ${validRoles.join(', ')}`,
        {
          extensions: { code: 'BAD_USER_INPUT' },
        }
      );
    }

    // Authentication check (optional - remove if public access is allowed)
    if (!context.session?.data?.id) {
      throw new GraphQLError('Authentication required to use AI chat', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Validate provider if specified
    let validatedProvider: ProviderType | undefined;
    if (provider) {
      const availableProviders = aiService.getAvailableProviders();
      if (provider !== 'gemini' && provider !== 'openai' && provider !== 'claude') {
        throw new GraphQLError(
          `Invalid provider: ${provider}. Available providers: ${availableProviders.join(', ')}`,
          {
            extensions: { code: 'BAD_USER_INPUT' },
          }
        );
      }
      validatedProvider = provider as ProviderType;
    }

    // Convert messages to the expected type
    const typedMessages: ChatMessage[] = messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    const response = await aiService.chat(typedMessages, {
      systemPrompt,
      temperature,
      provider: validatedProvider,
    });

    return {
      content: response.content,
      usage: response.usage || null,
      metadata: response.metadata || null,
    };
  } catch (error: any) {
    console.error('AI Chat error:', error);
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError(error.message || 'Failed to process AI chat request', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
