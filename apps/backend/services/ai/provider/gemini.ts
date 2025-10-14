import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, ChatMessage, ChatResponse, ChatOptions } from '../types';

export class GeminiProvider implements AIProvider {
  public name = 'gemini';
  private client: GoogleGenerativeAI;
  private defaultModel = 'gemini-2.0-flash';

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    try {
      const model = this.client.getGenerativeModel({
        model: options.model || this.defaultModel,
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxTokens || 1000,
        },
      });

      // Convert messages to Gemini format
      const history = this.convertMessagesToHistory(messages, options.systemPrompt);

      // Get the last user message
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role !== 'user') {
        throw new Error('Last message must be from user');
      }

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(lastMessage.content);

      return {
        content: result.response.text(),
        usage: {
          inputTokens: result.response.usageMetadata?.promptTokenCount || 0,
          outputTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: result.response.usageMetadata?.totalTokenCount || 0,
        },
        metadata: {
          model: this.defaultModel,
          provider: 'gemini',
        },
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Gemini API call failed: ${error}`);
    }
  }

  private convertMessagesToHistory(messages: ChatMessage[], systemPrompt?: string): any[] {
    const history: any[] = [];

    // Add system prompt as first user/model exchange if provided
    if (systemPrompt) {
      history.push(
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: "I understand. I'll follow these instructions." }] }
      );
    }

    // Convert messages (excluding the last one which is sent separately)
    const conversationMessages = messages.slice(0, -1);

    for (const message of conversationMessages) {
      if (message.role === 'system') continue; // Skip system messages in history

      history.push({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      });
    }

    return history;
  }

  async *streamChat(messages: ChatMessage[], options: ChatOptions = {}): AsyncIterable<string> {
    const model = this.client.getGenerativeModel({
      model: options.model || this.defaultModel,
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 1000,
      },
    });

    const history = this.convertMessagesToHistory(messages, options.systemPrompt);
    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage.content);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        yield chunkText;
      }
    }
  }
}
