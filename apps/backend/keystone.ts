import dotenv from 'dotenv';
import { config } from '@keystone-6/core';

dotenv.config();

import { withAuth, session } from './auth';
import * as Models from './models';
import { Query } from './api/resolvers/Query';
import { DateTime, JSON } from './api/resolvers/scalars';
import { typeDefs as customTypeDefs } from './api/schema/typeDefs';
import { Mutation as customMutations } from './api/resolvers/Mutation';
import { mergeSchemas, makeExecutableSchema } from '@graphql-tools/schema';

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
    },
    ui: {
      isAccessAllowed: (context) => context.session !== undefined,
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
          typeDefs: customTypeDefs,
          resolvers: {
            DateTime,
            JSON,
            Mutation: customMutations,
            Query,
            UpdateProfileResult: {
              user: async (parent: any, _args: any, context: any) => {
                const id = parent?.userId;
                if (!id) return null;
                return context.db.User.findOne({ where: { id } });
              },
            },
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
    },

    lists: Models,
    session,
  })
);
