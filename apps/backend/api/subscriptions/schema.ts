import { makeExecutableSchema } from '@graphql-tools/schema';
import { mergeSchemas } from '@graphql-tools/schema';
import { typeDefs } from '../schema/typeDefs';
import { Query } from '../resolvers/Query';
import { Mutation } from '../resolvers/Mutation';
import { Subscription } from '../resolvers/Subscription';
import { DateTime, JSON } from '../resolvers/scalars';

// Create a schema with subscriptions
const subscriptionSchema = makeExecutableSchema({
  typeDefs,
  resolvers: {
    DateTime,
    JSON,
    Query,
    Mutation,
    Subscription,
  },
});

// Export the schema
export const schema = subscriptionSchema;
