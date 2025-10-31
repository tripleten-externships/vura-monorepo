export type ShortMsg = { role: 'user' | 'assistant' | 'system'; content: string };

export type ConversationContext = {
  userId: string;
  conversationId: string;
  flowType?: 'onboarding' | 'general';
};
