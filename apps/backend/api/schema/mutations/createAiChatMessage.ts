import { Context } from '../../../types/context';
import { logger } from '../../../utils/logger';
import { aiService } from '../../../services/ai';

// Constants for validation
const MAX_PROMPT_LENGTH = 4000;
const DEFAULT_SESSION_TITLE = 'AI Chat Session';

/**
 * Creates an AI chat message, handles session management, and returns AI response
 * @param _ - unused root value, input: contains prompt and optional sessionId
 * @param input - Contains prompt and optional sessionId
 * @param context - Keystone context with session and DB access
 * @returns Structured payload with success, message, error, and sessionId
 */
export const createAiChatMessage = async (
  _: unknown,
  { input }: { input: { sessionId?: string; prompt: string } },
  context: Context
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  sessionId?: string;
}> => {
  const session = context.session;

  // Authentication check
  if (!session?.data?.id) {
    logger.warn('Unauthenticated AI chat attempt');
    return {
      success: false,
      error: 'User must be authenticated',
    };
  }

  const userId = String(session.data.id);
  const { sessionId, prompt } = input;

  // Input validation - empty prompt
  if (!prompt || prompt.trim().length === 0) {
    logger.warn('Empty prompt provided', { userId });
    return {
      success: false,
      error: 'Prompt is required',
    };
  }

  // Input validation - max length
  if (prompt.length > MAX_PROMPT_LENGTH) {
    logger.warn('Prompt exceeds maximum length', {
      userId,
      promptLength: prompt.length,
      maxLength: MAX_PROMPT_LENGTH,
    });
    return {
      success: false,
      error: `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`,
    };
  }

  try {
    let chatSessionId = sessionId;

    // Validate existing session if provided
    if (chatSessionId) {
      try {
        const existingSession = await context.db.AiChatSession.findOne({
          where: { id: chatSessionId },
        });

        if (!existingSession) {
          logger.warn('Invalid session ID provided', { userId, sessionId: chatSessionId });
          return {
            success: false,
            error: 'Invalid session ID',
          };
        }

        // Verify session ownership
        if (existingSession.userId !== userId) {
          logger.warn('Unauthorized session access attempt', {
            userId,
            sessionId: chatSessionId,
            ownerId: existingSession.userId,
          });
          return {
            success: false,
            error: 'Unauthorized access to session',
          };
        }

        logger.info('Using existing AI chat session', { userId, sessionId: chatSessionId });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Session validation failed', {
          userId,
          sessionId: chatSessionId,
          error: errorMessage,
        });
        return {
          success: false,
          error: 'Failed to validate session',
        };
      }
    } else {
      // Create new session
      try {
        logger.info('Creating new AI chat session', { userId });
        const newSession = await context.db.AiChatSession.createOne({
          data: {
            title: DEFAULT_SESSION_TITLE,
            status: 'active',
            user: { connect: { id: userId } },
            lastActiveAt: new Date().toISOString(),
          },
        });
        chatSessionId = String(newSession.id);
        logger.info('AI chat session created', { userId, sessionId: chatSessionId });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Session creation failed', { userId, error: errorMessage });
        return {
          success: false,
          error: 'Failed to create chat session',
        };
      }
    }

    // Save user message
    let userMessage;
    try {
      logger.debug('Saving user message', { userId, sessionId: chatSessionId });
      userMessage = await context.db.AiMessage.createOne({
        data: {
          content: prompt,
          author: 'user' as const,
          model: 'gemini',
          createdAt: new Date().toISOString(),
          session: { connect: { id: chatSessionId } },
        },
      });
      logger.info('User message saved', {
        userId,
        sessionId: chatSessionId,
        messageId: userMessage?.id,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('User message save failed', {
        userId,
        sessionId: chatSessionId,
        error: errorMessage,
      });
      return {
        success: false,
        error: 'Failed to save user message',
        sessionId: chatSessionId,
      };
    }

    // Call Gemini AI
    let aiResponse;
    const startTime = Date.now();
    try {
      logger.info('Calling Gemini AI', { userId, sessionId: chatSessionId });

      // Use the AI service to get response
      aiResponse = await aiService.chat([
        {
          role: 'user',
          content: prompt,
        },
      ]);

      const latency = Date.now() - startTime;
      logger.info('Gemini AI response received', {
        userId,
        sessionId: chatSessionId,
        latencyMs: latency,
        tokens: aiResponse.usage,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Gemini AI call failed', {
        userId,
        sessionId: chatSessionId,
        error: errorMessage,
      });
      return {
        success: false,
        error: 'Failed to get response from AI service',
        sessionId: chatSessionId,
      };
    }

    // Save assistant response
    try {
      logger.debug('Saving assistant response', { userId, sessionId: chatSessionId });

      await context.db.AiMessage.createOne({
        data: {
          content: aiResponse.content,
          author: 'assistant',
          model: 'gemini',
          createdAt: new Date().toISOString(),
          session: { connect: { id: chatSessionId } },
          parentMessage: { connect: { id: userMessage.id } },
          latencyMs: Date.now() - startTime,
          promptTokens: aiResponse.usage?.inputTokens,
          completionTokens: aiResponse.usage?.outputTokens,
          totalTokens: aiResponse.usage?.totalTokens,
        },
      });
      logger.info('Assistant message saved', { userId, sessionId: chatSessionId });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Assistant message save failed', {
        userId,
        sessionId: chatSessionId,
        error: errorMessage,
      });
      return {
        success: false,
        error: 'Failed to save assistant response',
        sessionId: chatSessionId,
      };
    }

    // Update session lastActiveAt
    try {
      await context.db.AiChatSession.updateOne({
        where: { id: chatSessionId },
        data: { lastActiveAt: new Date().toISOString() },
      });
      logger.debug('Session lastActiveAt updated', { sessionId: chatSessionId });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.warn('Session update failed', { sessionId: chatSessionId, error: errorMessage });
      // Non-critical — don't block success
    }

    return {
      success: true,
      message: 'AI response saved',
      sessionId: chatSessionId,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('createAiChatMessage error', { userId, error: errorMessage });
    return {
      success: false,
      error: 'Failed to process AI message',
    };
  }
};
