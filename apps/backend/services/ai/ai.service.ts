import dotenv from 'dotenv';
dotenv.config();

import { AIProvider, ChatMessage, ChatResponse, ChatOptions } from './types';
import { GeminiProvider } from './provider/gemini';
import { getWebSocketService } from '../websocket';

// Onboarding flow
import { FlowEngine } from './flows/onboarding/flowEngine';
import type { OnboardingStep } from './flows/onboarding/steps';

// Context Manager
import { ContextManager } from './context/contextManager';

// Extraction
import { Extractor } from './extract/extractor';
import { validatorFor, SlotKey } from './extract/schema';
import next from 'next';

export type ProviderType = 'gemini' | 'openai' | 'claude';

export class AIService {
  private providers: Map<ProviderType, AIProvider> = new Map();
  private defaultProvider: ProviderType = 'gemini';

  // AI Sub-services
  private flow = new FlowEngine();
  private ctx = new ContextManager(10); // short-term window of 10 messages
  private extractor!: Extractor;

  constructor() {
    this.initializeProviders();

    // Adapter for Extractor to call chat and get JSON response
    this.extractor = new Extractor({
      chat: async ({ messages }: { messages: ChatMessage[]; jsonSchema?: unknown }) => {
        const res = await this.chat(messages);
        return { text: (res as any)?.text, json: (res as any)?.json };
      },
    });
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
   * Start an onboarding flow for a user
   */
  async startOnboardingFlow(
    userId: string
  ): Promise<{ conversationId: string; firstPrompt: string }> {
    // unique convo ID
    const conversationId = `onb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    await this.ctx.init(conversationId, {
      userId,
      flowType: 'onboarding',
      longTerm: { onboarding: {} as OnboardingStep },
      meta: { step: 'age', completed: false },
    });

    const firstPrompt = this.flow.promptFor('age');
    await this.ctx.appendMessage(conversationId, 'assistant', firstPrompt);

    return { conversationId, firstPrompt };
  }

  /**
   * Continue onboarding flow,
   * validate/normalize, save to context, then return next prompt
   */
  async continueOnboarding(
    conversationId: string,
    userInput: string
  ): Promise<{ reply: string; done: boolean }> {
    const ctx = await this.ctx.load(conversationId);
    await this.ctx.appendMessage(conversationId, 'user', userInput);

    const slots = (ctx.longTerm.onboarding || {}) as OnboardingStep;

    // Determine which slot is still missing (in order)
    const order: SlotKey[] = ['age', 'parentCount', 'parentSpecialNeeds', 'personalChallenges'];
    const current = order.find((k) => {
      const v = (slots as any)[k];
      return v === undefined || v === null || (Array.isArray(v) && v.length === 0);
    });

    // If all slots are filled, generate plan
    if (!current) {
      const plan = await this.generateCarePlan(conversationId); // implement this method
      const reply = `Here is your personalized care plan:\n\n${plan}`;
      await this.ctx.appendMessage(conversationId, 'assistant', reply);
      await this.ctx.setMeta(conversationId, { completed: true });
      return { reply, done: true };
    }

    // Extract only the current field as JSON, then validate/normalize
    const validated = await this.extractor.run(
      [
        {
          role: 'user',
          content: `From the following input, extract only the field "${current}" as JSON with exactly that key.`,
        },
        { role: 'user', content: userInput },
      ],
      validatorFor(current) as any
    );

    // Merge into long-term onboarding slots
    const patch: Partial<OnboardingStep> = {
      [current]: (validated as any)[current],
    } as Partial<OnboardingStep>;

    const nextSlots = { ...slots, ...patch } as OnboardingStep;
    await this.ctx.setLongTerm(conversationId, { onboarding: nextSlots });

    // Determine next missing field
    const nextMissing = order.find((k) => {
      const v = (nextSlots as any)[k];
      return v === undefined || v === null || (Array.isArray(v) && v.length === 0);
    });

    if (!nextMissing) {
      const plan = await this.generateCarePlan(conversationId); // implement this method
      const reply = `Here is your personalized care plan:\n\n${plan}`;
      await this.ctx.appendMessage(conversationId, 'assistant', reply);
      await this.ctx.setMeta(conversationId, { completed: true });
      return { reply, done: true };
    } else {
      const prompt = this.flow.promptFor(nextMissing);
      await this.ctx.setMeta(conversationId, { step: nextMissing });
      await this.ctx.appendMessage(conversationId, 'assistant', prompt);
      return { reply: prompt, done: false };
    }
  }

  // Generate care plan based on collected onboarding data
  private async generateCarePlan(conversationId: string): Promise<string> {
    const ctx = await this.ctx.load(conversationId);
    const slots = (ctx.longTerm.onboarding ?? {}) as OnboardingStep;

    const system: ChatMessage = {
      role: 'system',
      content:
        'You are an expert caregiver assistant. Based on the user information, generate a personalized care plan with actionable steps.',
    };

    const facts =
      `Known facts about the user:\n` +
      `- Age: ${slots.age}\n` +
      `- Number of parents to care for: ${slots.parentCount}\n` +
      `- Parents special needs: ${JSON.stringify(slots.parentSpecialNeeds ?? [])}\n` +
      `- User personal challenges: ${JSON.stringify(slots.personalChallenges ?? [])}`;

    const user: ChatMessage = {
      role: 'user',
      content: facts + '\n\nPlease provide a detailed care plan.',
    };

    const res = await this.chat([system, user]);
    return (res as any)?.text || 'Unable to generate care plan at this time.';
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
