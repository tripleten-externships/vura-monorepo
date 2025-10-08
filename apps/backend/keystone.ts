import dotenv from 'dotenv';
import { config, graphql } from '@keystone-6/core';
import { createGroupChat } from './api/schema/mutations/createGroupChat';

dotenv.config();

import { withAuth, session } from './auth';
import * as Models from './models';

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

//Defines input for creating a group chat
const CreateGroupChatInput = graphql.inputObject({
  //graphql needs to know what fields the mutation expects
  name: 'CreateGroupChatInput',
  fields: {
    //required group name and memberIds is required, non null
    groupName: graphql.arg({ type: graphql.nonNull(graphql.String) }),
    memberIds: graphql.arg({ type: graphql.nonNull(graphql.list(graphql.nonNull(graphql.ID))) }),
  },
});

//output, what the mutation will return
const CreateGroupChatResult = graphql.object<{ message: string }>()({
  name: 'CreateGroupChatResult',
  fields: {
    message: graphql.field({
      type: graphql.nonNull(graphql.String), //required return message
      resolve(item) {
        //specifes how to get the message value
        return item.message;
      },
    }),
  },
});

//users will call to create a group chat
export const createGroupChatField = graphql.field({
  type: CreateGroupChatResult, //mutation returns a CreateGroupChatResult object
  args: { input: graphql.arg({ type: graphql.nonNull(CreateGroupChatInput) }) },
  resolve: async (root, { input }, context) => {
    await createGroupChat(root, { input }, context); //fuction that creates the group chat in database
    return { message: 'Group chat created successfully' }; //confirms the chat was created
  },
});
