// SDL for custom types/inputs/enums
import { gql } from 'graphql-tag';
import { createGroupChat } from '../schema/mutations/createGroupChat';

export const typeDefs = gql`
  input CreateGroupChatInput {
    groupName: String!
    memberIds: [ID!]!
  }

  type CreateGroupChatResult {
    groupChat: GroupChat!
    message: String!
  }

  extend type Mutation {
    createGroupChat(input: CreateGroupChatInput!): CreateGroupChatResult!
  }
`;
export const resolvers = {
  Mutation: {
    createGroupChat,
  },
};
