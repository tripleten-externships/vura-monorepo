import { GraphQLError } from 'graphql';
import { Context } from '.keystone/types';

export interface SendChatMessageInput {
  groupId: string;
  message: string;
}

export const sendChatMessage = async (
  root: any,
  { input }: { input: SendChatMessageInput },
  context: Context
) => {
  const session = context.session;

  //check if user is logged in
  if (!session?.itemId) {
    throw new GraphQLError('User must be authenticated to send messages');
  }

  const { groupId, message } = input;

  //validate input
  if (!groupId) throw new GraphQLError('Group ID is required');
  if (!message) throw new GraphQLError('Message content is required');

  const trimmedMessage = message.trim();
  if (!trimmedMessage) throw new GraphQLError('Message cannot be empty');
  if (trimmedMessage.length > 1000) throw new GraphQLError('Message is too long');

  //check that the group chat exists
  const groupChat = await context.db.GroupChat.findOne({
    where: { id: groupId },
  });

  if (!groupChat) throw new GraphQLError('Group chat not found');

  //verify that the user is a member or owner
  //`findOne` doesn’t include relationships, so it fetchs members separately
  const fullGroupChat = await context.query.GroupChat.findOne({
    where: { id: groupId },
    query: 'id groupName owner { id } members { id }',
  });

  if (!fullGroupChat) throw new GraphQLError('Group chat not found');

  const isOwner = fullGroupChat.owner?.id === session.itemId;
  const isMember = fullGroupChat.members?.some((m: { id: string }) => m.id === session.itemId);

  if (!isOwner && !isMember) {
    throw new GraphQLError('You are not a member of this group chat');
  }

  try {
    //create the message using keystone relationship fields
    const chatMessage = await context.db.ChatMessage.createOne({
      data: {
        message: trimmedMessage,
        sender: { connect: { id: session.itemId } },
        //relationship field should match ChatMessage model
        group: { connect: { id: groupId } },
      },
    });

    console.log(`Message sent by ${session.itemId} in group ${groupId}: ${trimmedMessage}`);

    return {
      chatMessage,
      message: 'Message sent successfully',
    };
  } catch (error) {
    console.error('Error sending message:', error);
    throw new GraphQLError('Failed to send chat message');
  }
};
