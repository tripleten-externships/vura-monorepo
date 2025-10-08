// wires our custom schema into Keystone
export { typeDefs } from './schema/typeDefs';

import { userProfileQueries } from './schema/queries/userProfile';
import { Query as BaseQuery } from './resolvers/Query';

export const Query = {
  ...BaseQuery,
  ...userProfileQueries,
};
