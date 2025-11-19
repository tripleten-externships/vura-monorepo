import { gql } from '../../__generated__/gql';

export const AI_CHAT_MUTATION = gql(`
  mutation AiChat($input: AiChatInput!) {
    aiChat(input: $input) {
      content
      usage
      metadata
    }
  }
`);
