import { ApolloClient, HttpLink, InMemoryCache, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_TOKEN = '__drops_token';
const apiBaseUrl = (process.env.VITE_API_URL as string | undefined) || 'http://localhost:3001';
const wsPrefix = (process.env.VITE_API_URL as string | undefined) ? 'wss' : 'ws';

export const httpLink = new HttpLink({ uri: `${apiBaseUrl.replace(/\/$/, '')}/api/graphql` });

const authLink = setContext(async (operation, { headers }) => {
  const token = await AsyncStorage.getItem(AUTH_TOKEN);
  return {
    headers: {
      ...headers,
      authorization: token || null,
    },
  };
});

// Create WebSocket link for subscriptions
const createWebSocketLink = async () => {
  const token = await AsyncStorage.getItem(AUTH_TOKEN);

  return new GraphQLWsLink(
    createClient({
      url: `${wsPrefix}://${apiBaseUrl.replace(/^https?:\/\/|\/$/g, '')}/graphql/subscriptions`,
      connectionParams: {
        Authorization: token || '',
      },
    })
  );
};

// Function to create the split link
const createSplitLink = async () => {
  const wsLink = await createWebSocketLink();

  // Split links based on operation type
  return split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
    },
    wsLink,
    authLink.concat(httpLink)
  );
};

// Initialize with HTTP link first
const link = authLink.concat(httpLink);

// Create Apollo Client
export const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});

// Update the link with subscription support when ready
createSplitLink().then((splitLink) => {
  client.setLink(splitLink);
});

export async function setGraphqlHeaders(_token: string | undefined) {
  const token = _token ?? (await AsyncStorage.getItem(AUTH_TOKEN));

  // Update auth link
  const newAuthLink = setContext((operation, { headers }) => {
    return {
      headers: {
        ...headers,
        authorization: token || null,
      },
    };
  });

  // Create new split link with updated auth
  const wsLink = await createWebSocketLink();

  // Create new split link
  const newLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
    },
    wsLink,
    newAuthLink.concat(httpLink)
  );

  // Update client link
  client.setLink(newLink);
}
