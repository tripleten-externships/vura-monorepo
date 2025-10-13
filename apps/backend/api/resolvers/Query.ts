// stitches query resolvers together
import { getResources } from '../schema/queries/getResources';
import { userProfile } from '../schema/queries/userProfile';

export const Query = {
  userProfile,
  getResources,
};
