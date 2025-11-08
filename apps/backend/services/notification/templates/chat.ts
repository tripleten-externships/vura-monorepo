// based on group chat model
export interface ChatTemplateInput {
  groupId: string;
  groupName: string;
  senderName: string;
  message: string;
  messageId: string;
}

// template for new messages in a group chat

export const chatTemplates = {
  newGroupMessage(input: ChatTemplateInput) {
    const preview = input.message.slice(0, 50); // preview to show first 50 characters
    // return notification object
    return {
      content: `${input.senderName} in ${input.groupName}: ${preview}`,
      // url for user to navigate to message when user clicks on it
      actionUrl: `/chat/${input.groupId}/messages/${input.messageId}`,
      // not sure if this is needed, but Metatdata is option in the type.ts createNotificationInput
      metadata: {
        groupId: input.groupId,
        messageId: input.messageId,
        senderName: input.senderName,
        event: 'new_group_message',
      },
      relatedChatId: input.groupId,
    };
  },

  // template for mentions in a group chat
  mention(input: ChatTemplateInput) {
    const preview = input.message.slice(0, 50);

    return {
      content: `You were mentioned in ${input.groupName} by ${input.senderName}: ${preview}`,
      actionUrl: `/group/${input.groupId}/message/${input.messageId}`,
      metadata: {
        groupId: input.groupId,
        messageId: input.messageId,
        senderName: input.senderName,
        event: 'mention',
        isMention: true,
      },
      relatedChatId: input.groupId,
    };
  },
};
