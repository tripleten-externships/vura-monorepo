// stitches query resolvers together
import { getResources } from '../schema/queries/getResources';

export const Query = {
  getResources,
  _empty: () => null,
};
