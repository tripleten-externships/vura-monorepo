// stitches mutation resolvers together
import { saveQuestionnaireResponse, submitQuestionnaire } from '../schema/mutations/questionnaire';

export const Mutation = {
  saveQuestionnaireResponse,
  submitQuestionnaire,
  _empty: () => null,
};
