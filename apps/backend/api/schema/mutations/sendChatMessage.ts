import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';

export interface SendChatMessageInput {
  groupId: string;
  message: string;
}

export const sendChatMessage = async (
  _: any,
  { input }: { input: SendChatMessageInput },
  context: Context
) => {
  const session = context.session;

  // check if user is logged in
  if (!session?.data?.id) {
    throw new GraphQLError('User must be authenticated to send messages', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  const { groupId, message } = input;

  // validate input
  if (!groupId) {
    throw new GraphQLError('Group ID is required', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  if (!message) {
    throw new GraphQLError('Message content is required', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    throw new GraphQLError('Message cannot be empty', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  if (trimmedMessage.length > 1000) {
    throw new GraphQLError('Message is too long', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  // check that the group chat exists
  const groupChat = await context.db.GroupChat.findOne({
    where: { id: groupId },
  });

  if (!groupChat) {
    throw new GraphQLError('Group chat not found', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  // verify that the user is a member or owner
  // `findOne` doesn't include relationships, so it fetches members separately
  const fullGroupChat = await context.query.GroupChat.findOne({
    where: { id: groupId },
    query: 'id groupName owner { id } members { id }',
  });

  if (!fullGroupChat) {
    throw new GraphQLError('Group chat not found', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  const isOwner = fullGroupChat.owner?.id === session.data.id;
  const isMember = fullGroupChat.members?.some((m: { id: string }) => m.id === session.data.id);

  if (!isOwner && !isMember) {
    throw new GraphQLError('You are not a member of this group chat', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  try {
    // create the message using keystone relationship fields
    const chatMessage = await context.db.ChatMessage.createOne({
      data: {
        message: trimmedMessage,
        sender: { connect: { id: session.data.id } },
        // relationship field should match ChatMessage model
        group: { connect: { id: groupId } },
      },
    });

    console.log(`Message sent by ${session.data.id} in group ${groupId}: ${trimmedMessage}`);

    // fetch the created message with relationships populated
    const populatedMessage = await context.query.ChatMessage.findOne({
      where: { id: String(chatMessage.id) },
      query: 'id message createdAt sender { id name email } group { id }',
    });

    if (!populatedMessage) {
      throw new GraphQLError('Failed to retrieve created message', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }

    return {
      chatMessage: {
        id: populatedMessage.id,
        message: populatedMessage.message,
        createdAt: populatedMessage.createdAt,
        sender: populatedMessage.sender,
        group: populatedMessage.group?.id || groupId,
      },
      message: 'Message sent successfully',
    };
  } catch (error: any) {
    console.error('Error sending message:', error);
    throw new GraphQLError('Failed to send chat message', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
