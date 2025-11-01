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
import { requireAuth } from '../middlewares/auth';
import { typingIndicator } from '../schema/mutations/typingIndicator';
import { updateUserStatus } from '../schema/mutations/userStatus';

const withAuth = (resolver: Function) => (root: any, args: any, context: any, info: any) => {
  requireAuth(context.session);
  return resolver(root, args, context, info);
};
// Register all mutation resolvers here
// Public mutations (signup, login) run directly
// Protected mutations are wrapped with `withAuth()` to enforce session validation
export const Mutation = {
  signup,
  login,
  // Wrap protected mutations with custom resolvers (via withAuth)
  // Protected mutations
  customCreateForumPost: withAuth(customCreateForumPost),
  customDeleteForumPost: withAuth(customDeleteForumPost),
  customCreateGroupChat: withAuth(customCreateGroupChat),
  sendChatMessage: withAuth(sendChatMessage),
  saveQuestionnaireResponse: withAuth(saveQuestionnaireResponse),
  submitQuestionnaire: withAuth(submitQuestionnaire),
  updateProfile: withAuth(updateProfile),
  aiChat: withAuth(aiChat),
  typingIndicator: withAuth(typingIndicator),
  updateUserStatus: withAuth(updateUserStatus),
};
