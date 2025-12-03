import { CreateNotificationInput, NotificationType, NotificationPriority } from '../types';

// based on group chat model
export interface ChatTemplateInput {
  groupId: string;
  groupName: string;
  senderId: string;
  senderName: string;
  message: string;
  messageId: string;
}

// Return type for chat notification templates (omitting userId as it's provided separately)
type ChatNotificationTemplate = Omit<CreateNotificationInput, 'userId'>;

/**
 * Creates a preview of the message with truncation indicator
 */
function createMessagePreview(message: string, maxLength: number = 50): string {
  if (message.length <= maxLength) {
    return message;
  }
  return `${message.slice(0, maxLength)}...`;
}

/**
 * Template for new messages in a group chat
 */
export function newGroupMessageTemplate(input: ChatTemplateInput): ChatNotificationTemplate {
  const preview = createMessagePreview(input.message, 50);

  return {
    type: 'chat_message',
    notificationType: 'CHAT' as NotificationType,
    priority: 'MEDIUM' as NotificationPriority,
    content: `${input.senderName} sent a message in ${input.groupName}`,
    actionUrl: `/chat/${input.groupId}`,
    metadata: {
      groupId: input.groupId,
      messageId: input.messageId,
      senderId: input.senderId,
      senderName: input.senderName,
      groupName: input.groupName,
      messagePreview: preview,
      event: 'new_group_message',
    },
    relatedChatId: input.groupId,
  };
}

/**
 * Template for mentions in a group chat
 */
export function mentionTemplate(input: ChatTemplateInput): ChatNotificationTemplate {
  const preview = createMessagePreview(input.message, 50);

  return {
    type: 'chat_mention',
    notificationType: 'CHAT' as NotificationType,
    priority: 'HIGH' as NotificationPriority,
    content: `${input.senderName} mentioned you in ${input.groupName}`,
    actionUrl: `/chat/${input.groupId}`,
    metadata: {
      groupId: input.groupId,
      messageId: input.messageId,
      senderId: input.senderId,
      senderName: input.senderName,
      groupName: input.groupName,
      messagePreview: preview,
      event: 'mention',
      isMention: true,
    },
    relatedChatId: input.groupId,
  };
}

/**
 * Helper function to get the appropriate chat notification template
 */
export function getChatNotificationTemplate(
  type: 'message' | 'mention',
  data: ChatTemplateInput
): ChatNotificationTemplate {
  switch (type) {
    case 'message':
      return newGroupMessageTemplate(data);
    case 'mention':
      return mentionTemplate(data);
    default:
      throw new Error(`Unknown chat notification type: ${type}`);
  }
}
