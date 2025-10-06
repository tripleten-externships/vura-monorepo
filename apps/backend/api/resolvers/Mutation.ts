// stitches mutation resolvers together
// import { someMutation } from '../schema/mutations/someMutation';
import { createForumPost } from '../schema/mutations/createForumPost';
import { deleteForumPost } from '../schema/mutations/deleteForumPost';

export const Mutation = {
  createForumPost,
  deleteForumPost,
  _empty: () => null,
};
