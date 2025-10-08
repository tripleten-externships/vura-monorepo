// stitches query resolvers together
// import { someQuery } from '../schema/queries/someQuery';
import { userProfileQueries } from '../schema/queries/userProfile';

export const Query = {
  // someQuery,
  _empty: () => null,
  ...userProfileQueries,
};
