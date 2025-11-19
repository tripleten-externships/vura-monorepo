import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import { aiService } from '../services/ai';
import { ChatMessage } from '../services/ai/types';
import { getWebSocketService } from '../services/websocket';
import type { KeystoneContext } from '@keystone-6/core/types';

/**
 * registers chat routes with auth validation so only authenticated keystone sessions can hit the
 * ai endpoints. we resolve the request-specific context via withRequest to pick up the session.
 */
export function chatRoutes(app: Express, contextProvider: () => Promise<KeystoneContext>) {
  const router = express.Router();

  router.use(bodyParser.json({ limit: '4mb' }));

  router.post('/api', async (req: Request, res: Response) => {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const scopedContext = await createRequestContext(contextProvider, req, res);
    if (!scopedContext.session?.data?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { messages, systemPrompt, temperature, provider, sessionId } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const typedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })) as ChatMessage[];

    const isStreaming = req.headers['accept'] === 'text/event-stream';
    const userId = scopedContext.session.data.id;

    if (isStreaming) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      try {
        const useWebSockets = Boolean(sessionId);

        for await (const chunk of aiService.streamChat(typedMessages, {
          systemPrompt,
          temperature,
          provider,
          userId: useWebSockets ? userId : undefined,
          sessionId: useWebSockets ? sessionId : undefined,
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
      const useWebSockets = Boolean(sessionId);

      const response = await aiService.chat(typedMessages, {
        systemPrompt,
        temperature,
        provider,
        userId: useWebSockets ? userId : undefined,
        sessionId: useWebSockets ? sessionId : undefined,
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

  app.use('/chat', router);
}

async function createRequestContext(
  contextProvider: () => Promise<KeystoneContext>,
  req: Request,
  res: Response
) {
  const baseContext = await contextProvider();
  if (typeof (baseContext as any).withRequest === 'function') {
    return (baseContext as any).withRequest(req, res);
  }
  return baseContext;
}
