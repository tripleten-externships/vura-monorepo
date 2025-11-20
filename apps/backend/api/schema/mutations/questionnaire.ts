import type { Context } from '../../../types/context';
import { getEventBus } from '../../subscriptions/eventBus';
import {
  QuestionnaireService,
  SaveQuestionnaireResponseInput,
  SaveQuestionnaireResponseResult,
  SubmitQuestionnaireInput,
  SubmitQuestionnaireResult,
} from '../../../services/questionnaire';

export const saveQuestionnaireResponse = async (
  _: unknown,
  { input }: { input: SaveQuestionnaireResponseInput },
  context: Context
): Promise<SaveQuestionnaireResponseResult> => {
  const questionnaireService = new QuestionnaireService({ context, eventBus: getEventBus() });
  return questionnaireService.saveResponses(input);
};

export const submitQuestionnaire = async (
  _: unknown,
  { input }: { input: SubmitQuestionnaireInput },
  context: Context
): Promise<SubmitQuestionnaireResult> => {
  const questionnaireService = new QuestionnaireService({ context, eventBus: getEventBus() });
  return questionnaireService.submitResponse(input);
};
