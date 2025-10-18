import { GraphQLError } from 'graphql';
// Keystone context type, giving access to session, db, query, etc.
import { Context } from '../../../types/context';

export const createAiChatMessage = async (
  // - _: unused root value, input: contains prompt and optional sessionId,
  // context: Keystone context with session and DB access,
  // Returns a structured payload with success, message, error, and sessionId.

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

  // Ensures the user is logged in. If not, returns early with an error.
  if (!session?.data?.id) {
    return {
      success: false,
      error: 'User must be authenticated',
    };
  }

  // Extracts userId, sessionId, and prompt. Validates that prompt is non-empty.
  const userId = String(session.data.id);
  const { sessionId, prompt } = input;

  if (!prompt || prompt.trim().length === 0) {
    return {
      success: false,
      error: 'Prompt is required',
    };
  }

  try {
    // Fetch or create AiChatSession.
    // Begins the main logic block — all DB and Gemini operations happen here.
    // If no sessionId is provided, creates a new AiChatSession.
    // Sets title, status, user, and timestamps. Stores the new session ID.

    let chatSessionId = sessionId;
    if (!chatSessionId) {
      const newSession = await context.db.AiChatSession.createOne({
        data: {
          title: `Chat with Gemini - ${new Date().toISOString()}`,
          status: 'active',
          user: { connect: { id: userId } },
          lastActiveAt: new Date().toISOString(),
        },
      });
      chatSessionId = String(newSession.id);
    }

    // Saves the user's prompt as an AiMessage. Links it to the session.
    // Marks it as authored by user.

    const userMessage = await context.db.AiMessage.createOne({
      data: {
        content: prompt,
        author: 'user',
        model: 'gemini',
        createdAt: new Date().toISOString(),
        session: { connect: { id: chatSessionId } },
      },
    });

    // Call Gemini (mocked here)
    const geminiResponse = await callGemini(prompt); // Replace with actual Gemini API call

    // Save assistant response. Links it to session and parent user message.
    // Records metadata like latency and token usage.
    await context.db.AiMessage.createOne({
      data: {
        content: geminiResponse.content,
        author: 'assistant',
        model: 'gemini',
        createdAt: new Date().toISOString(),
        session: { connect: { id: chatSessionId } },
        parentMessage: { connect: { id: userMessage.id } },
        latencyMs: geminiResponse.latencyMs,
        promptTokens: geminiResponse.promptTokens,
        completionTokens: geminiResponse.completionTokens,
        totalTokens: geminiResponse.totalTokens,
      },
    });

    // Update session lastActiveAt.
    // Returns a success payload with the session ID.
    // Logs any error and returns a failure response.

    await context.db.AiChatSession.updateOne({
      where: { id: chatSessionId },
      data: { lastActiveAt: new Date().toISOString() },
    });

    return {
      success: true,
      message: 'AI response saved',
      sessionId: chatSessionId,
    };
  } catch (error: any) {
    console.error('createAiChatMessage error:', error?.message || error);
    return {
      success: false,
      error: 'Failed to process AI message',
    };
  }
};

// Replace this with actual Gemini API integration
async function callGemini(prompt: string): Promise<{
  content: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}> {
  const start = Date.now();
  // Simulate Gemini response
  return {
    content: `Gemini response to: "${prompt}"`,
    latencyMs: Date.now() - start,
    promptTokens: 20,
    completionTokens: 50,
    totalTokens: 70,
  };
}
