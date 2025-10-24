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

  // implement
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
      // Second parameter is for context
      {
        context: async (ctx: any) => {
          // Get the Keystone context
          const keystoneContext = await context();

          // Get auth token from connection parameters
          const connectionParams = ctx.connectionParams;
          const authToken = connectionParams?.Authorization || connectionParams?.authorization;

          // If we have a token, try to get the session
          let session = null;
          if (authToken && keystoneContext.sessionStrategy) {
            try {
              // For WebSocket subscriptions, we need to parse the token to get user identity
              // This assumes a JWT token format - adjust if using a different format
              try {
                // Extract token payload (assumes JWT format: header.payload.signature)
                const parts = (authToken as string).split('.');
                if (parts.length === 3) {
                  // Decode the base64 payload
                  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                  const jsonPayload = Buffer.from(base64, 'base64').toString();
                  const payload = JSON.parse(jsonPayload);

                  // Create a session with the user data from token
                  session = {
                    data: {
                      id: payload.id || payload.sub || payload.userId,
                      name: payload.name,
                      email: payload.email,
                      isAuthenticated: true,
                    },
                  };

                  logger.info(`Created session for user ID: ${session.data.id}`);
                } else {
                  // Try to extract user ID from token string if not JWT
                  // This is a fallback for custom token formats
                  const tokenStr = authToken as string;
                  const userIdMatch =
                    tokenStr.match(/id[=:]([^;,&]+)/i) || tokenStr.match(/user[=:]([^;,&]+)/i);

                  if (userIdMatch && userIdMatch[1]) {
                    session = {
                      data: {
                        id: userIdMatch[1],
                        isAuthenticated: true,
                      },
                    };
                    logger.info(`Created session with extracted user ID: ${session.data.id}`);
                  } else {
                    logger.warn('Could not extract user ID from token, using generic ID');
                    session = {
                      data: {
                        id: 'subscription-user',
                        isAuthenticated: true,
                      },
                    };
                  }
                }
              } catch (tokenError) {
                logger.error('Failed to parse auth token:', tokenError);
                // Fallback to a generic session
                session = {
                  data: {
                    id: 'anonymous-user',
                    isAuthenticated: false,
                  },
                };
              }
            } catch (error) {
              logger.error('Subscription auth error:', error);
            }
          }

          // Return the context with session if available
          return {
            ...keystoneContext,
            session,
          };
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
