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

export const GENERATE_CARE_PLAN = gql(`
  mutation GenerateCarePlan($input: SaveQuestionnaireResponseInput!) {
    generateCarePlanFromQuestionnaire(input: $input) {
      status
      carePlanId
      carePlan {
        id
        title
        summary
      }
    }
  }
`);
