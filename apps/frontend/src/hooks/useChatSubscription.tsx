import { useEffect, useState } from 'react';
import { useSubscription, useMutation } from '@apollo/client';
import {
  MESSAGE_SENT_SUBSCRIPTION,
  TYPING_INDICATOR_SUBSCRIPTION,
  USER_STATUS_SUBSCRIPTION,
} from '../graphql/subscriptions/chatSubscriptions';
import {
  SEND_CHAT_MESSAGE,
  TYPING_INDICATOR,
  UPDATE_USER_STATUS,
} from '../graphql/mutations/chatMutations';

interface ChatMessage {
  id: string;
  message: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  group: string;
}

interface TypingIndicator {
  userId: string;
  username: string;
  groupId: string;
  isTyping: boolean;
}

interface UserStatus {
  userId: string;
  username: string;
  status: string;
}

interface UseChatSubscriptionProps {
  groupId: string;
  userId?: string; // Optional, for filtering user status updates
}

export function useChatSubscription({ groupId, userId }: UseChatSubscriptionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [userStatuses, setUserStatuses] = useState<Map<string, string>>(new Map());

  // Subscriptions
  const { data: messageData } = useSubscription(MESSAGE_SENT_SUBSCRIPTION, {
    variables: { groupId },
  });

  const { data: typingData } = useSubscription(TYPING_INDICATOR_SUBSCRIPTION, {
    variables: { groupId },
  });

  const { data: statusData } = useSubscription(USER_STATUS_SUBSCRIPTION, {
    variables: { userId },
  });

  // Mutations
  const [sendMessage] = useMutation(SEND_CHAT_MESSAGE);
  const [sendTypingIndicator] = useMutation(TYPING_INDICATOR);
  const [updateUserStatus] = useMutation(UPDATE_USER_STATUS);

  // Handle new messages
  useEffect(() => {
    if (messageData?.messageSent) {
      const newMessage = messageData.messageSent;
      setMessages((prev) => [...prev, newMessage]);
    }
  }, [messageData]);

  // Handle typing indicators
  useEffect(() => {
    if (typingData?.typingIndicator) {
      const { userId, username, isTyping } = typingData.typingIndicator;

      setTypingUsers((prev) => {
        const updated = new Map(prev);
        if (isTyping) {
          updated.set(userId, username);
        } else {
          updated.delete(userId);
        }
        return updated;
      });
    }
  }, [typingData]);

  // Handle user status changes
  useEffect(() => {
    if (statusData?.userStatusChanged) {
      const { userId, username, status } = statusData.userStatusChanged;

      setUserStatuses((prev) => {
        const updated = new Map(prev);
        updated.set(userId, status);
        return updated;
      });
    }
  }, [statusData]);

  // Helper function to send a message
  const sendChatMessage = async (message: string) => {
    try {
      await sendMessage({
        variables: {
          input: {
            groupId,
            message,
          },
        },
      });
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  // Helper function to send typing indicator
  const setTyping = async (isTyping: boolean) => {
    try {
      await sendTypingIndicator({
        variables: {
          input: {
            groupId,
            isTyping,
          },
        },
      });
      return true;
    } catch (error) {
      console.error('Error sending typing indicator:', error);
      return false;
    }
  };

  // Helper function to update user status
  const setUserStatus = async (status: 'online' | 'offline') => {
    try {
      await updateUserStatus({
        variables: {
          input: {
            status,
          },
        },
      });
      return true;
    } catch (error) {
      console.error('Error updating user status:', error);
      return false;
    }
  };

  return {
    messages,
    typingUsers: Array.from(typingUsers.entries()).map(([id, name]) => ({ id, name })),
    userStatuses: Array.from(userStatuses.entries()).map(([id, status]) => ({ id, status })),
    sendChatMessage,
    setTyping,
    setUserStatus,
  };
}
