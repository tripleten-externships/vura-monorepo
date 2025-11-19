import { ApolloClient, HttpLink, InMemoryCache, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { clearStoredToken, getStoredToken, setStoredToken } from '../services/storage';

const DEFAULT_API_URL = 'http://localhost:3001';

const resolveApiUrl = (rawUrl: string): URL => {
  try {
    return new URL(rawUrl);
  } catch {
    return new URL(DEFAULT_API_URL);
  }
};

const apiUrlString =
  typeof VITE_API_URL !== 'undefined' && VITE_API_URL ? VITE_API_URL : DEFAULT_API_URL;
const apiUrl = resolveApiUrl(apiUrlString);
const httpEndpoint = `${apiUrl.origin.replace(/\/$/, '')}/api/graphql`;
const wsProtocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
const wsSubscriptionsUrl = `${wsProtocol}//${apiUrl.host}/graphql/subscriptions`;

export const httpLink = new HttpLink({
  uri: httpEndpoint,
  credentials: 'include',
});

const authLink = setContext(async (_, { headers }) => {
  const token = await getStoredToken();
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

const createWebSocketLink = async () => {
  const token = await getStoredToken();

  return new GraphQLWsLink(
    createClient({
      url: wsSubscriptionsUrl,
      connectionParams: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    })
  );
};

const createSplitLink = async () => {
  const wsLink = await createWebSocketLink();

  return split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
    },
    wsLink,
    authLink.concat(httpLink)
  );
};

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

createSplitLink().then((splitLink) => client.setLink(splitLink));

export async function setGraphqlHeaders(token?: string) {
  if (typeof token === 'string') {
    await setStoredToken(token);
  } else if (token === undefined) {
    await clearStoredToken();
  }

  const resolvedToken = token ?? (await getStoredToken());

  const refreshedAuthLink = setContext(async (_, { headers }) => ({
    headers: {
      ...headers,
      ...(resolvedToken ? { authorization: `Bearer ${resolvedToken}` } : {}),
    },
  }));

  const wsLink = await createWebSocketLink();
  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
    },
    wsLink,
    refreshedAuthLink.concat(httpLink)
  );

  client.setLink(splitLink);
}
