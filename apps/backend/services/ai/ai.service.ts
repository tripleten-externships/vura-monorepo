import dotenv from 'dotenv';
dotenv.config();

import { AIProvider, ChatMessage, ChatResponse, ChatOptions } from './types';
import { GeminiProvider } from './provider/gemini';
import { getWebSocketService } from '../websocket';

export type ProviderType = 'gemini' | 'openai' | 'claude';

export class AIService {
  private providers: Map<ProviderType, AIProvider> = new Map();
  private defaultProvider: ProviderType = 'gemini';

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize Gemini (always available)
    if (process.env.GEMINI_API_KEY) {
      this.providers.set('gemini', new GeminiProvider(process.env.GEMINI_API_KEY));
    }

    // future providers can be added here:
    // if (process.env.OPENAI_API_KEY) {
    //   this.providers.set('openai', new OpenAIProvider(process.env.OPENAI_API_KEY));
    // }
    // if (process.env.CLAUDE_API_KEY) {
    //   this.providers.set('claude', new ClaudeProvider(process.env.CLAUDE_API_KEY));
    // }
  }

  /**
   * Send a chat message using the specified or default provider
   */
  async chat(
    messages: ChatMessage[],
    options: ChatOptions & { provider?: ProviderType } = {}
  ): Promise<ChatResponse> {
    const providerType = options.provider || this.defaultProvider;
    const provider = this.providers.get(providerType);

    if (!provider) {
      throw new Error(`Provider ${providerType} not available. Check API keys.`);
    }

    return provider.chat(messages, options);
  }

  /**
   * Stream chat response using the specified or default provider
   */
  async *streamChat(
    messages: ChatMessage[],
    options: ChatOptions & {
      provider?: ProviderType;
      userId?: string;
      sessionId?: string;
    } = {}
  ): AsyncIterable<string> {
    const providerType = options.provider || this.defaultProvider;
    const provider = this.providers.get(providerType);
    const { userId, sessionId } = options;

    if (!provider || !provider.streamChat) {
      throw new Error(`Streaming not available for provider ${providerType}`);
    }

    // if WebSocket is available and userId is provided, emit streaming events
    let useWebSockets = false;
    let websocketService;

    if (userId && sessionId) {
      try {
        websocketService = getWebSocketService();
        useWebSockets = true;
      } catch (error) {
        console.warn('WebSocket service not available for AI streaming');
      }
    }

    // emit start event if using WebSockets
    if (useWebSockets && websocketService && userId) {
      websocketService.emitToUser(userId, 'ai:message:start', { sessionId });
    }

    // stream the content
    for await (const chunk of provider.streamChat(messages, options)) {
      // emit chunk via WebSocket if available
      if (useWebSockets && websocketService && userId) {
        websocketService.emitAiMessageChunk(userId, chunk, sessionId!);
      }

      // also yield the chunk for HTTP streaming
      yield chunk;
    }

    // emit completion event if using WebSockets
    if (useWebSockets && websocketService && userId && sessionId) {
      websocketService.emitToUser(userId, 'ai:message:complete', {
        sessionId,
        completed: true,
      });
    }
  }

  /**
   * Switch the default provider - makes migration super easy
   */
  setDefaultProvider(provider: ProviderType) {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider ${provider} not initialized`);
    }
    this.defaultProvider = provider;
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): ProviderType[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider is available
   */
  isProviderAvailable(provider: ProviderType): boolean {
    return this.providers.has(provider);
  }
}

// Export singleton instance
export const aiService = new AIService();
