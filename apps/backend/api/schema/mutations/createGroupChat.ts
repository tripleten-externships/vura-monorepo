import { GraphQLError } from 'graphql';
import { Context } from '.keystone/types';

//inputs for creating a group chat
export interface CreateGroupChatInput {
  groupName: string; //name of the group chat
  memberIds: string[]; //array of user ids
}

//resolver function to create a group chat
export const createGroupChat = async (
  root: any,
  { input }: { input: CreateGroupChatInput },
  context: Context //gives session info
) => {
  const session = context.session; //grab the session of the currently logged in user
  if (!session?.itemId) {
    //checks that the user is authenticated
    throw new GraphQLError('User must be authenticated to create group chats');
  }

  const { groupName, memberIds } = input;

  //Validation
  //checks for group name
  if (!groupName?.trim()) {
    throw new GraphQLError('Group name is required');
  }
  ////checks the group name length
  if (groupName.length < 1 || groupName.length > 100) {
    throw new GraphQLError('Group name must be between 1 and 100 characters');
  }
  //makes sure at least one member is added
  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    throw new GraphQLError('At least one member must be specified');
  }
  //users cant add themselves, and makes user the owner
  if (memberIds.includes(session.itemId)) {
    throw new GraphQLError('Cannot add yourself as a member (you are automatically the owner)');
  }

  //Verify the member ids match the existing users
  const existingUsers = await context.db.User.findMany({
    where: { id: { in: memberIds } },
  });

  //for invalid ids
  if (existingUsers.length !== memberIds.length) {
    throw new GraphQLError('One or more specified users do not exist');
  }

  try {
    //Create group chat in db
    const groupChat = await context.db.GroupChat.createOne({
      data: {
        groupName: groupName,
        //makes current user the owner
        owner: { connect: { id: session.itemId } },
        members: {
          //connects the members specified in input
          connect: memberIds.map((id) => ({ id })),
        },
      },
    });

    //debugging
    console.log(`GroupChat created by ${session.itemId}: ${groupChat.id}`);

    return {
      groupChat,
      message: 'Group chat created successfully',
    };
  } catch (error) {
    console.error('Error creating group chat:', error);
    throw new GraphQLError('Failed to create group chat');
  }
};
