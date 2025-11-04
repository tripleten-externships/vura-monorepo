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
import { createAiChatMessage } from '../schema/mutations/createAiChatMessage';
import { typingIndicator } from '../schema/mutations/typingIndicator';
import { updateUserStatus } from '../schema/mutations/userStatus';
import { customCreateNotification } from '../schema/mutations/createNotification';
import { customMarkNotificationAsRead } from '../schema/mutations/markNotificationAsRead';
import { customMarkAllNotificationsAsRead } from '../schema/mutations/markAllNotificationsAsRead';

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
  createAiChatMessage,
  typingIndicator,
  updateUserStatus,
  customCreateNotification,
  customMarkNotificationAsRead,
  customMarkAllNotificationsAsRead,
};
