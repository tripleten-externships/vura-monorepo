import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_TOKEN = '__drops_token';
const apiBaseUrl = (process.env.VITE_API_URL as string | undefined) || 'http://localhost:3001';

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

const link = authLink.concat(httpLink);

export const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});

export async function setGraphqlHeaders(_token: string | undefined) {
  const token = _token ?? (await AsyncStorage.getItem(AUTH_TOKEN));
  const authLink = setContext((operation, { headers }) => {
    return {
      headers: {
        ...headers,
        authorization: token || null,
      },
    };
  });

  client.setLink(authLink.concat(httpLink));
}
