import { gql } from '@apollo/client';

// Subscribe to new chat messages in a specific group
export const MESSAGE_SENT_SUBSCRIPTION = gql`
  subscription MessageSent($groupId: ID!) {
    messageSent(groupId: $groupId) {
      id
      message
      createdAt
      sender {
        id
        name
        email
      }
      group
    }
  }
`;

// Subscribe to typing indicators in a specific group
export const TYPING_INDICATOR_SUBSCRIPTION = gql`
  subscription TypingIndicator($groupId: ID!) {
    typingIndicator(groupId: $groupId) {
      userId
      username
      groupId
      isTyping
    }
  }
`;

// Subscribe to user status changes
export const USER_STATUS_SUBSCRIPTION = gql`
  subscription UserStatusChanged($userId: ID) {
    userStatusChanged(userId: $userId) {
      userId
      username
      status
    }
  }
`;

// Subscribe to AI chat messages for a specific session
export const AI_MESSAGE_SUBSCRIPTION = gql`
  subscription AiMessageReceived($sessionId: ID!) {
    aiMessageReceived(sessionId: $sessionId) {
      content
      usage
      metadata
    }
  }
`;
