export type ShortMsg = { role: 'user' | 'assistant' | 'system'; content: string };

export type ConversationContext = {
  userId: string;
  conversationId: string;
  flowType?: 'onboarding' | 'general';
  shortTerm: ShortMsg[];
  longTerm: Record<string, unknown>; // stores OnboardingStep here
  meta: Record<string, unknown>; // additional metadata
};

// temporary in-memory store for contexts
const mem = {
  convo: new Map<string, ConversationContext>(),
  messages: new Map<string, ShortMsg[]>(),
};

export class ContextManager {
  constructor(private shortWindow = 10) {}

  async init(conversationId: string, seed: Partial<ConversationContext>) {
    const ctx: ConversationContext = {
      userId: seed.userId ?? 'unknown',
      conversationId,
      flowType: seed.flowType ?? 'general',
      shortTerm: [],
      longTerm: seed.longTerm ?? {},
      meta: seed.meta ?? {},
    };

    mem.convo.set(conversationId, ctx);
    mem.messages.set(conversationId, []);
    return ctx;
  }

  async load(conversationId: string): Promise<ConversationContext> {
    const ctx = mem.convo.get(conversationId);
    if (!ctx) throw new Error(`Context not found ${conversationId}`);
    const history = mem.messages.get(conversationId) ?? [];
    return { ...ctx, shortTerm: history.slice(-this.shortWindow) };
  }

  async appendMessage(conversationId: string, role: ShortMsg['role'], content: string) {
    const arr = mem.messages.get(conversationId);
    if (!arr) throw new Error('Conversation not initialized');
    arr.push({ role, content });
  }

  async setLongTerm(conversationId: string, patch: Record<string, unknown>) {
    const ctx = mem.convo.get(conversationId);
    if (!ctx) throw new Error('No context found');
    ctx.longTerm = { ...ctx.longTerm, ...patch };
  }

  async setMeta(conversationId: string, patch: Record<string, unknown>) {
    const ctx = mem.convo.get(conversationId);
    if (!ctx) throw new Error('No context found');
    ctx.meta = { ...ctx.meta, ...patch };
  }

  buildPrompt(ctx: ConversationContext, systemPreamble?: string): ShortMsg[] {
    const sys = systemPreamble ?? 'You are a helpful assistant.';
    const longTermSummary = this.renderLongTerm(ctx.longTerm);
    return [
      { role: 'system', content: sys + '\n\nKnown facts:\n' + longTermSummary },
      ...ctx.shortTerm,
    ];
  }

  private renderLongTerm(obj: Record<string, unknown>): string {
    const pairs = Object.entries(obj).map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`);
    return pairs.join('\n') || '- (none)';
  }
}
