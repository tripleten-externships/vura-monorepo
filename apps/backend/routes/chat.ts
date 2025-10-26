import { Express, Request, Response } from 'express';
import { aiService } from '../services/ai';
import { ChatMessage } from '../services/ai/types';
import bodyParser from 'body-parser';

export function chatRoutes(app: Express) {
  app.use('/api/chat', bodyParser.json({ limit: '4mb' }));
  app.post('/api/chat', async (req: Request, res: Response) => {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { messages, systemPrompt, temperature, provider } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const typedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })) as ChatMessage[];

    const isStreaming = req.headers['accept'] === 'text/event-stream';

    if (isStreaming) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      try {
        for await (const chunk of aiService.streamChat(typedMessages, {
          systemPrompt,
          temperature,
          provider,
        })) {
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        }
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      } catch (error: any) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      } finally {
        res.end();
      }
      return;
    }

    try {
      const response = await aiService.chat(typedMessages, {
        systemPrompt,
        temperature,
        provider,
      });

      res.status(200).json({
        content: response.content,
        usage: response.usage,
        metadata: response.metadata,
      });
    } catch (error: any) {
      console.error('Chat API error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  });
}
