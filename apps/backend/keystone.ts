import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/backend/.env') });

import { config } from '@keystone-6/core';
import { mergeSchemas, makeExecutableSchema } from '@graphql-tools/schema';
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
import { createSubscriptionServer } from './api/subscriptions/server';
import { initializeEventHandlers } from './api/subscriptions/handlers';
import { aiService } from './services/ai/ai.service';

initGoogleStrategy();

const dbUrl =
  process.env.DATABASE_URL ||
  `mysql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:3306/${process.env.DB_NAME}`;

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
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
      },
      extendExpressApp: (app, commonContext) => {
        // Register authentication routes (OAuth)
        authRoutes(app, () => Promise.resolve(commonContext));
        // Register chat routes
        app.use('/chat', chatRoutes); // all endpoints now live under /chat/*
      },

      extendHttpServer(server, context) {
        // Initialize AI service with Prisma for database persistence
        aiService.initializeWithPrisma(context.prisma);

        // Initialize WebSocket service for chat
        initWebSocketService({
          httpServer: server,
          context: () => Promise.resolve(context),
        });

        // Initialize GraphQL subscription server
        createSubscriptionServer({
          httpServer: server,
          context: () => Promise.resolve(context),
        });

        initializeEventHandlers(context);
      },
    },
    ui: {
      // Only allow admin users to access the admin UI
      isAccessAllowed: (context) => {
        return context.session?.data?.isAdmin === true;
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
          typeDefs,
          resolvers: {
            DateTime,
            JSON,
            Mutation,
            Query,
            Subscription,
          },
        });
        return mergeSchemas({
          schemas: [schema, customSchema],
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
