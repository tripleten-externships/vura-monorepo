export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export interface AIProvider {
  chat(opts: { messages: ChatMessage[] }): Promise<{ text?: string; json?: unknown }>;
}

function tryExtractJSON(text?: string): unknown | undefined {
  if (!text) return undefined;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return undefined;
  const slice = text.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return undefined;
  }
}

export class Extractor {
  constructor(private provider: AIProvider) {}

  // Ask Gemini for JSON for a field, then validate with the provided validator.

  async run<T>(
    messages: ChatMessage[],
    validator: (obj: any) => [true, T] | [false, string]
  ): Promise<T> {
    let current: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are an expert data extractor. Extract ONLY the requested field as JSON.',
      },
      ...messages,
    ];

    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await this.provider.chat({ messages: current });

      const candidate = res.json ?? tryExtractJSON(res.text) ?? res.text ?? '{}';
      let obj: any;
      try {
        obj = typeof candidate === 'string' ? JSON.parse(candidate) : candidate;
      } catch {
        obj = {};
      }

      const result = validator(obj);
      if (result[0]) {
        return result[1] as T;
      } else {
        // Retry once with validator error

        current = [
          ...current,
          {
            role: 'system',
            content: `Validation failed: ${result[1]}. Please extract the field again, ensuring the output is valid JSON.`,
          },
        ];
      }
    }

    throw new Error('Failed to extract valid data after multiple attempts');
  }
}
