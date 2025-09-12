import dotenv from 'dotenv';
import { config } from '@keystone-6/core';

dotenv.config();

import { withAuth, session } from './auth';
import * as Models from './models';

const dbUrl =
  process.env.DATABASE_URL ||
  `mysql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:3306/${process.env.DB_NAME}`;

// configure base path for deployment behind API Gateway
const basePath = process.env.DEPLOY_BASE_PATH || '/local';

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
      },
      // static asset serving for API Gateway deployment
      ...(process.env.NODE_ENV === 'production' &&
        basePath && {
          extendExpressApp: (app: any) => {
            const express = require('express');
            const path = require('path');

            // serve Next.js static assets with base path
            app.use(
              `${basePath}/_next/static`,
              express.static(path.join(__dirname, '.next/static'), {
                maxAge: '1y',
                immutable: true,
              })
            );

            // also serve without base path for direct requests
            app.use(
              '/_next/static',
              express.static(path.join(__dirname, '.next/static'), {
                maxAge: '1y',
                immutable: true,
              })
            );

            // serve favicon and other root assets
            app.use(
              `${basePath}/favicon.ico`,
              express.static(path.join(__dirname, '.next/static/favicon.ico'))
            );
            app.use(
              '/favicon.ico',
              express.static(path.join(__dirname, '.next/static/favicon.ico'))
            );
          },
        }),
    },
    ui: {
      isAccessAllowed: (context) => context.session !== undefined,
      ...(basePath && {
        basePath,
      }),
    },
    db: {
      provider: 'mysql',
      url: dbUrl,
      enableLogging: true,
      idField: { kind: 'uuid' },
    },
    telemetry: false,
    graphql: {
      path: `${basePath}/api/graphql`,
      playground: true,
      apolloConfig: {
        introspection: true,
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
