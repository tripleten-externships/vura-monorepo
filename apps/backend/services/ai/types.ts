// common types for all ai providers
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
}

export interface ChatResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  model?: string;
}

export interface AIProvider {
  name: string;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  streamChat?(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<string>;
}

export interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
}

export interface ChatWithFunctionsResponse extends ChatResponse {
  functionCall?: FunctionCall;
}
