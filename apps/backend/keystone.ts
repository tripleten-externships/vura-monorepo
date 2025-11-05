import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/backend/.env') });

import { config } from '@keystone-6/core';
import { mergeSchemas, makeExecutableSchema } from '@graphql-tools/schema';
import { withAuth, session } from './api/middlewares/auth';

import * as Models from './models';
import { Query } from './api/resolvers/Query';
import { Mutation } from './api/resolvers/Mutation';
import { Subscription } from './api/resolvers/Subscription';
import { DateTime, JSON } from './api/resolvers/scalars';
import { typeDefs } from './api/schema/typeDefs';
import { chatRoutes } from './routes/chat';

import { initWebSocketService } from './services/websocket';
import { createSubscriptionServer } from './api/subscriptions/server';
import { initializeEventHandlers } from './api/subscriptions/handlers';

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
      extendExpressApp: (app) => {
        chatRoutes(app);
      },
      extendHttpServer(server, context) {
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
      // signed in users with session data to access the admin ui
      isAccessAllowed: (context) => !!context.session?.data,
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
