import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import { getWebSocketService } from '../../../services/websocket';
import { pubsub, SubscriptionTopics } from '../../subscriptions/pubsub';
import { ChatMessageCreatedEvent } from '../../subscriptions/events';

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

    const messagePayload = {
      id: populatedMessage.id,
      message: populatedMessage.message,
      createdAt: populatedMessage.createdAt,
      sender: {
        id: populatedMessage.sender.id,
        name: populatedMessage.sender.name || populatedMessage.sender.email,
      },
      groupId: populatedMessage.group?.id || groupId,
    };

    // Emit the message via WebSockets (legacy approach)
    try {
      const websocketService = getWebSocketService();
      websocketService.emitNewChatMessage(messagePayload);
    } catch (wsError) {
      console.error('Failed to emit WebSocket event:', wsError);
      // don't throw error here, just log it - the message was saved successfully
    }

    // Publish the message to GraphQL subscriptions
    try {
      // Create a message object that matches the expected format in the subscription resolver
      const subscriptionPayload = {
        id: populatedMessage.id,
        message: populatedMessage.message,
        createdAt: populatedMessage.createdAt,
        sender: populatedMessage.sender,
        groupId: populatedMessage.group?.id || groupId,
      };

      // publish to the NEW_CHAT_MESSAGE topic for GraphQL subscriptions
      pubsub.publish(SubscriptionTopics.NEW_CHAT_MESSAGE, subscriptionPayload);
    } catch (subError) {
      console.error('Failed to publish subscription event:', subError);
      // Don't throw error, the message was saved successfully
    }

    // publish CHAT_MESSAGE_CREATED event for internal event handlers
    try {
      // collect all group member IDs (owner + members)
      const allMemberIds: string[] = [];
      if (fullGroupChat.owner?.id) {
        allMemberIds.push(fullGroupChat.owner.id);
      }
      if (fullGroupChat.members && Array.isArray(fullGroupChat.members)) {
        fullGroupChat.members.forEach((member: { id: string }) => {
          if (member.id && !allMemberIds.includes(member.id)) {
            allMemberIds.push(member.id);
          }
        });
      }

      // create event payload
      const chatMessageEvent: ChatMessageCreatedEvent = {
        messageId: populatedMessage.id,
        message: trimmedMessage,
        senderId: session.data.id,
        senderName: populatedMessage.sender.name || populatedMessage.sender.email,
        groupId: populatedMessage.group?.id || groupId,
        groupName: fullGroupChat.groupName,
        createdAt: populatedMessage.createdAt,
        memberIds: allMemberIds,
      };

      // publish the event - event handlers will process it asynchronously
      pubsub.publish(SubscriptionTopics.CHAT_MESSAGE_CREATED, chatMessageEvent);

      console.log('Chat message event published', {
        messageId: populatedMessage.id,
        groupId,
      });
    } catch (eventError) {
      console.error('Failed to publish chat message event:', eventError);
      // don't throw error, the message was saved successfully
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
