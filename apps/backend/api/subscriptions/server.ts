import { CloseCode, makeServer } from 'graphql-ws';
import { WebSocketServer } from 'ws';
import { Server as HttpServer } from 'http';
import { Context } from '../../types/context';
import { schema } from './schema';
import { logger } from '../../utils/logger';

interface SubscriptionServerOptions {
  httpServer: HttpServer;
  context: () => Promise<Context>;
}

// minimal version of `useServer` from `graphql-ws/use/ws`
export function createSubscriptionServer(options: SubscriptionServerOptions) {
  const { httpServer, context } = options;
  // make
  const server = makeServer({ schema });

  // create websocket server
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql/subscriptions',
  });

  wsServer.on('connection', (socket, request) => {
    // a new socket opened, let graphql-ws take over
    const closed = server.opened(
      {
        protocol: socket.protocol, // will be validated
        send: (data) =>
          new Promise((resolve, reject) => {
            socket.send(data, (err) => (err ? reject(err) : resolve()));
          }), // control your data flow by timing the promise resolve

        close: (code, reason) => socket.close(code, reason), // there are protocol standard closures
        onMessage: (cb) =>
          socket.on('message', async (event) => {
            try {
              // wait for the the operation to complete
              // - if init message, waits for connect
              // - if query/mutation, waits for result
              // - if subscription, waits for complete
              await cb(event.toString());
            } catch (err) {
              // all errors that could be thrown during the
              // execution of operations will be caught here
              socket.close(CloseCode.InternalServerError, (err as Error).message);
            }
          }),
      },
      // second parameter is for context
      {
        context: async (ctx: any) => {
          const keystoneContext = await context();
          const connectionParams = ctx.connectionParams || {};
          const authToken = connectionParams.Authorization || connectionParams.authorization;

          if (!authToken) {
            socket.close(CloseCode.Unauthorized, 'Missing auth token');
            throw new Error('Unauthorized');
          }

          try {
            if (!keystoneContext.sessionStrategy) {
              socket.close(CloseCode.Unauthorized, 'Session strategy unavailable');
              throw new Error('Unauthorized');
            }

            const req = {
              headers: {
                cookie: `keystonejs-session=${authToken}`,
              },
            } as any;

            const res = {} as any;

            logger.info('GraphQL-WS: Attempting to create context with session');

            // use Keystone's withRequest() to create a context with session populated
            const contextWithSession = await (keystoneContext as any).withRequest(req, res);

            logger.info(
              'GraphQL-WS: Session:',
              JSON.stringify(contextWithSession.session, null, 2)
            );

            if (!contextWithSession.session?.data?.id) {
              socket.close(CloseCode.Unauthorized, 'Invalid session');
              throw new Error('Unauthorized');
            }

            return contextWithSession;
          } catch (err) {
            logger.error('Subscription authentication failed:', err);
            socket.close(CloseCode.Unauthorized, 'Authentication failed');
            throw new Error('Unauthorized');
          }
        },
      }
    );

    // notify server that the socket closed
    socket.once('close', (code: number, reason: string) => {
      if (typeof reason === 'string') {
        closed(code, reason);
      } else {
        closed(code, '');
      }
    });
  });
}
