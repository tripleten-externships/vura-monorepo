import { NextApiRequest, NextApiResponse } from 'next';
import { aiService } from '../services/ai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, systemPrompt, temperature, provider } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const response = await aiService.chat(messages, {
      systemPrompt,
      temperature,
      provider,
    });

    res.status(200).json({
      content: response.content,
      usage: response.usage,
      metadata: response.metadata,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
