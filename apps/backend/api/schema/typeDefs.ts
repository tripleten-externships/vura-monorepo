import { gql } from 'graphql-tag';
// SDL for custom types/inputs/enums
export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  # Questionnaire Input Types
  input SaveQuestionnaireResponseInput {
    questionnaireId: ID!
    carePlanId: ID
    checklistId: ID
    responses: [QuestionResponseInput!]!
    isDraft: Boolean
  }

  input QuestionResponseInput {
    questionId: ID!
    answer: JSON!
    confidence: Int
    notes: String
  }

  input SubmitQuestionnaireInput {
    questionnaireResponseId: ID!
    updateCarePlanProgress: Boolean
  }

  # Questionnaire Output Types
  type SaveQuestionnaireResponseResult {
    questionnaireResponseId: ID!
    message: String!
    completionPercentage: Float!
    carePlanUpdated: Boolean
    checklistUpdated: Boolean
  }

  type SubmitQuestionnaireResult {
    questionnaireResponseId: ID!
    message: String!
    completedAt: DateTime!
    carePlanProgressScore: Float
    checklistCompletionScore: Float
  }

  type Mutation {
    _empty: String
    saveQuestionnaireResponse(
      input: SaveQuestionnaireResponseInput!
    ): SaveQuestionnaireResponseResult!
    submitQuestionnaire(input: SubmitQuestionnaireInput!): SubmitQuestionnaireResult!
  }

  type Query {
    _empty: String
  }
`;
