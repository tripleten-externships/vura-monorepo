import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/backend/.env') });

import { config } from '@keystone-6/core';
import { mergeSchemas, makeExecutableSchema } from '@graphql-tools/schema';
import { constraintDirective, constraintDirectiveTypeDefs } from 'graphql-constraint-directive';
import initGoogleStrategy from './google-strategy';
import { withAuth, session } from './api/middlewares/auth';

import * as Models from './models';
import { Query } from './api/resolvers/Query';
import { Mutation } from './api/resolvers/Mutation';
import { Subscription } from './api/resolvers/Subscription';
import { DateTime, JSON } from './api/resolvers/scalars';
import { typeDefs } from './api/schema/typeDefs';
import { chatRoutes } from './routes/chat';
import { authRoutes } from './routes/auth';

import { initWebSocketService } from './services/websocket';
import { ForumPostCreatedEvent } from './api/subscriptions/events';
import { createSubscriptionServer } from './api/subscriptions/server';
import { initializeEventHandlers } from './api/subscriptions/handlers';
import { initEventBus } from './api/subscriptions/eventBus';
import { SubscriptionTopics } from './api/subscriptions/pubsub';
import { logger } from './utils/logger';
import { aiService } from './services/ai/ai.service';

initGoogleStrategy();

const dbUrl =
  process.env.DATABASE_URL ||
  `mysql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:3306/${process.env.DB_NAME}`;

const defaultCorsOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const corsOrigins =
  process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()) || defaultCorsOrigins;
const applyConstraintDirective = constraintDirective();

export default withAuth(
  config({
    server: {
      // use an unprivileged default port for local dev
      port: process.env.PORT
        ? parseInt(process.env.PORT)
        : process.env.NODE_ENV === 'production'
          ? 80
          : 3001,
      cors: {
        origin: corsOrigins,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
      },
      extendExpressApp: (app, commonContext) => {
        // Middleware to convert/override Bearer tokens into the keystonejs-session cookie
        app.use((req: any, res: any, next: any) => {
          const authHeader = req.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '').trim();
            const otherCookies = (req.headers.cookie || '')
              .split(';')
              .map((cookie: string) => cookie.trim())
              .filter((cookie: string) => cookie && !cookie.startsWith('keystonejs-session='));
            req.headers.cookie = [`keystonejs-session=${token}`, ...otherCookies].join('; ');
          }
          next();
        });

        // Register authentication routes (OAuth)
        authRoutes(app, () => Promise.resolve(commonContext));
        // Register chat routes
        chatRoutes(app, () => Promise.resolve(commonContext));
      },

      extendHttpServer(server, context) {
        // Initialize AI service with Prisma for database persistence
        aiService.initializeWithPrisma(context.prisma);

        // Initialize WebSocket service for chat
        const websocketService = initWebSocketService({
          httpServer: server,
          context: () => Promise.resolve(context),
        });

        const eventBus = initEventBus();
        eventBus.addFanOut<ForumPostCreatedEvent>(
          SubscriptionTopics.FORUM_POST_CREATED,
          (payload) => {
            try {
              websocketService.emitNewForumPost({
                userId: payload.userId,
                postId: payload.postId,
                title: payload.title,
                topic: payload.topic,
                content: payload.content,
                authorName: payload.authorName,
                createdAt: payload.createdAt,
              });
            } catch (error) {
              logger.error('failed to fan out forum post to websocket', { error });
            }
          }
        );

        // Initialize GraphQL subscription server
        createSubscriptionServer({
          httpServer: server,
          context: () => Promise.resolve(context),
        });

        initializeEventHandlers(context, eventBus);
      },
    },
    ui: {
      // give access if the user has either the admin role or the legacy isAdmin flag
      isAccessAllowed: (context) => {
        const roleIsAdmin = context.session?.data?.role === 'admin';
        const flagIsAdmin = context.session?.data?.isAdmin === true;
        return Boolean(roleIsAdmin || flagIsAdmin);
      },
      basePath: '/admin/ui',
    },
    db: {
      provider: 'mysql',
      url: dbUrl,
      enableLogging: true,
      idField: { kind: 'uuid' },
    },
    telemetry: false,
    graphql: {
      path: '/api/graphql',
      playground: true,
      apolloConfig: {
        introspection: true,
      },
      extendGraphqlSchema: (schema) => {
        // Merge Keystone's generated schema with custom executable schema.
        const customSchema = makeExecutableSchema({
          typeDefs: [constraintDirectiveTypeDefs, typeDefs],
          resolvers: {
            DateTime,
            JSON,
            Mutation,
            Query,
            Subscription,
          },
        });
        const constrainedSchema = applyConstraintDirective(customSchema);
        return mergeSchemas({
          schemas: [schema, constrainedSchema],
        });
      },
    },
    storage: {
      s3_file_storage: {
        kind: 's3',
        type: 'file',
        bucketName: process.env.S3_BUCKET_NAME || 'vura-keystonejs',
        region: process.env.S3_REGION || 'us-east-1',
        accessKeyId: process.env.S3_ACCESS_KEY_ID || 'keystone',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'keystone',
        signed: { expiry: 5000 },
        forcePathStyle: true,
      },
      s3_image_storage: {
        kind: 's3',
        type: 'image',
        bucketName: process.env.S3_BUCKET_NAME || 'vura-keystonejs',
        region: process.env.S3_REGION || 'us-east-1',
        accessKeyId: process.env.S3_ACCESS_KEY_ID || 'keystone',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'keystone',
        signed: { expiry: 5000 },
        forcePathStyle: true,
      },
    },

    lists: Models,
    session,
  })
);
