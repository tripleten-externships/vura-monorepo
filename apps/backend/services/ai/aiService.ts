import { AIProvider, ChatMessage, ChatResponse, ChatOptions } from './types';
import { GeminiProvider } from './providers/gemini';

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
    options: ChatOptions & { provider?: ProviderType } = {}
  ): AsyncIterable<string> {
    const providerType = options.provider || this.defaultProvider;
    const provider = this.providers.get(providerType);

    if (!provider || !provider.streamChat) {
      throw new Error(`Streaming not available for provider ${providerType}`);
    }

    yield* provider.streamChat(messages, options);
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
