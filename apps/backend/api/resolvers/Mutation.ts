// stitches mutation resolvers together
import { signup } from '../schema/mutations/signup';
import { login } from '../schema/mutations/login';
import { createForumPost } from '../schema/mutations/createForumPost';
import { deleteForumPost } from '../schema/mutations/deleteForumPost';
import { createGroupChat } from '../schema/mutations/createGroupChat';

export const Mutation = {
  signup,
  login,
  customCreateForumPost: createForumPost,
  customDeleteForumPost: deleteForumPost,
  customCreateGroupChat: createGroupChat,
};
