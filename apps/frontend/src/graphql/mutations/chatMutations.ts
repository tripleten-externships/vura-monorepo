import { gql } from '@apollo/client';

// Send a chat message
export const SEND_CHAT_MESSAGE = gql`
  mutation SendChatMessage($input: SendChatMessageInput!) {
    sendChatMessage(input: $input) {
      chatMessage {
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
      message
    }
  }
`;

// Send typing indicator
export const TYPING_INDICATOR = gql`
  mutation TypingIndicator($input: TypingIndicatorInput!) {
    typingIndicator(input: $input) {
      success
      message
    }
  }
`;

// Update user status
export const UPDATE_USER_STATUS = gql`
  mutation UpdateUserStatus($input: UserStatusInput!) {
    updateUserStatus(input: $input) {
      success
      message
    }
  }
`;
