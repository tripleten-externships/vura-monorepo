// stitches mutation resolvers together
// import { someMutation } from '../schema/mutations/someMutation';
import { updateProfile } from '../schema/mutations/updateProfile';

export const Mutation = {
  // someMutation,
  updateProfile,
  _empty: () => null,
};
