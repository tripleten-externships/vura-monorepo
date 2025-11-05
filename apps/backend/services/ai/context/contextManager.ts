import type { PrismaClient, Prisma } from '@prisma/client';

export type ShortMsg = { role: 'user' | 'assistant' | 'system'; content: string };

export type ConversationContext = {
  userId: string;
  conversationId: string;
  flowType?: 'onboarding' | 'general';
  shortTerm: ShortMsg[];
  longTerm: Prisma.JsonObject; // stores OnboardingStep here
  meta: Prisma.JsonObject; // additional metadata
};

export class ContextManager {
  private prisma: PrismaClient | null = null;

  constructor(private shortWindow = 10) {}

  // Initialize with Prisma client (called from service)
  setPrisma(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async init(conversationId: string, seed: Partial<ConversationContext>) {
    if (!this.prisma) {
      throw new Error('ContextManager not initialized with Prisma client');
    }

    const ctx: ConversationContext = {
      userId: seed.userId ?? 'unknown',
      conversationId,
      flowType: seed.flowType ?? 'general',
      shortTerm: [],
      longTerm: seed.longTerm ?? {},
      meta: seed.meta ?? {},
    };

    // Create or update AI chat session in database
    try {
      await this.prisma.aiChatSession.upsert({
        where: { id: conversationId },
        create: {
          id: conversationId,
          title: `${seed.flowType || 'general'} conversation`,
          status: 'active',
          metadata: {
            flowType: ctx.flowType,
            longTerm: ctx.longTerm,
            meta: ctx.meta,
          },
          user: seed.userId ? { connect: { id: seed.userId } } : undefined,
        },
        update: {
          metadata: {
            flowType: ctx.flowType,
            longTerm: ctx.longTerm,
            meta: ctx.meta,
          },
          lastActiveAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error initializing context in database:', error);
      throw new Error('Failed to initialize conversation context');
    }

    return ctx;
  }

  async load(conversationId: string): Promise<ConversationContext> {
    if (!this.prisma) {
      throw new Error('ContextManager not initialized with Prisma client');
    }

    try {
      const session = await this.prisma.aiChatSession.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: this.shortWindow,
          },
          user: true,
        },
      });

      if (!session) {
        throw new Error(`Context not found: ${conversationId}`);
      }

      const metadata = (session.metadata as Prisma.JsonObject) || {};
      const history = session.messages.reverse().map((msg) => ({
        role: msg.author as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

      return {
        userId: session.userId || 'unknown',
        conversationId: session.id,
        flowType: (metadata.flowType as 'onboarding' | 'general') || 'general',
        shortTerm: history,
        longTerm: (metadata.longTerm as Prisma.JsonObject) || {},
        meta: (metadata.meta as Prisma.JsonObject) || {},
      };
    } catch (error) {
      console.error('Error loading context from database:', error);
      throw new Error('Failed to load conversation context');
    }
  }

  async appendMessage(conversationId: string, role: ShortMsg['role'], content: string) {
    if (!this.prisma) {
      throw new Error('ContextManager not initialized with Prisma client');
    }

    try {
      await this.prisma.aiMessage.create({
        data: {
          content,
          author: role,
          session: { connect: { id: conversationId } },
        },
      });
    } catch (error) {
      console.error('Error appending message to database:', error);
      throw new Error('Failed to append message');
    }
  }

  async setLongTerm(conversationId: string, patch: Prisma.JsonObject) {
    if (!this.prisma) {
      throw new Error('ContextManager not initialized with Prisma client');
    }

    try {
      const session = await this.prisma.aiChatSession.findUnique({
        where: { id: conversationId },
      });

      if (!session) {
        throw new Error('Context not found');
      }

      const metadata = (session.metadata as Prisma.JsonObject) || {};
      const updatedLongTerm = { ...((metadata.longTerm as Prisma.JsonObject) || {}), ...patch };

      await this.prisma.aiChatSession.update({
        where: { id: conversationId },
        data: {
          metadata: {
            ...metadata,
            longTerm: updatedLongTerm,
          },
          lastActiveAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating long-term context:', error);
      throw new Error('Failed to update long-term context');
    }
  }

  async setMeta(conversationId: string, patch: Prisma.JsonObject) {
    if (!this.prisma) {
      throw new Error('ContextManager not initialized with Prisma client');
    }

    try {
      const session = await this.prisma.aiChatSession.findUnique({
        where: { id: conversationId },
      });

      if (!session) {
        throw new Error('Context not found');
      }

      const metadata = (session.metadata as Prisma.JsonObject) || {};
      const updatedMeta = { ...((metadata.meta as Prisma.JsonObject) || {}), ...patch };

      await this.prisma.aiChatSession.update({
        where: { id: conversationId },
        data: {
          metadata: {
            ...metadata,
            meta: updatedMeta,
          },
          lastActiveAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating meta context:', error);
      throw new Error('Failed to update meta context');
    }
  }

  buildPrompt(ctx: ConversationContext, systemPreamble?: string): ShortMsg[] {
    const sys = systemPreamble ?? 'You are a helpful assistant.';
    const longTermSummary = this.renderLongTerm(ctx.longTerm);
    return [
      { role: 'system', content: sys + '\n\nKnown facts:\n' + longTermSummary },
      ...ctx.shortTerm,
    ];
  }

  private renderLongTerm(obj: Prisma.JsonObject): string {
    const pairs = Object.entries(obj).map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`);
    return pairs.join('\n') || '- (none)';
  }
}
