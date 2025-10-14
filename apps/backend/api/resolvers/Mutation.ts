// stitches mutation resolvers together
import { signup } from '../schema/mutations/signup';
import { login } from '../schema/mutations/login';
import { customCreateForumPost } from '../schema/mutations/createForumPost';
import { customDeleteForumPost } from '../schema/mutations/deleteForumPost';
import { customCreateGroupChat } from '../schema/mutations/createGroupChat';
import { sendChatMessage } from '../schema/mutations/sendChatMessage';
import { saveQuestionnaireResponse, submitQuestionnaire } from '../schema/mutations/questionnaire';
import { updateProfile } from '../schema/mutations/updateProfile';
import { aiChat } from '../schema/mutations/aiChat';

export const Mutation = {
  signup,
  login,
  customCreateForumPost,
  customDeleteForumPost,
  customCreateGroupChat,
  sendChatMessage,
  saveQuestionnaireResponse,
  submitQuestionnaire,
  updateProfile,
  aiChat,
};
