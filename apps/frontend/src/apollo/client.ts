import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { GRAPHQL_ENDPOINT } from '../config';
import { getToken } from '../store/secureStore';

const httpLink = new HttpLink({ uri: GRAPHQL_ENDPOINT });

// Apollo link that injects the Authorization header into each request
const authLink = new ApolloLink((operation, forward) => {
  // ApolloLink can return a Promise to allow async token retrieval
  return new Promise((resolve, reject) => {
    getToken()
      .then((token) => {
        if (token) {
          // Attach the Authorization header to the outgoing request
          operation.setContext(({ headers = {} }) => ({
            headers: {
              ...headers,
              authorization: `Bearer ${token}`,
            },
          }));
        }
      })
      .catch(() => {
        // Ignore token read errors and continue without auth header
      })
      .finally(() => {
        resolve(forward(operation));
      });
  }) as any; // Cast to satisfy ApolloLink typing for async usage
});
// Create and export the Apollo Client instance
export const apolloClient = new ApolloClient({
  // authLink runs first, then httpLink sends the request
  link: ApolloLink.from([authLink, httpLink]),
  // In-memory cache for normalized GraphQL response data
  cache: new InMemoryCache(),
});
