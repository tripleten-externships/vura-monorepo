// stitches mutation resolvers together
import { createGroupChat } from '../schema/mutations/createGroupChat';
import { sendChatMessage } from '../schema/mutations/sendChatMessage';

export const Mutation = {
  createGroupChat,
  sendChatMessage,
};
