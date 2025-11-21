import { Context } from '../../../types/context';
import { getEventBus } from '../../subscriptions/eventBus';
import {
  AssignQuestionnaireInput,
  AssignQuestionnaireResult,
  QuestionnaireService,
} from '../../../services/questionnaire';

export const assignQuestionnaire = async (
  _: unknown,
  { input }: { input: AssignQuestionnaireInput },
  context: Context
): Promise<AssignQuestionnaireResult> => {
  const questionnaireService = new QuestionnaireService({ context, eventBus: getEventBus() });
  return questionnaireService.assignQuestionnaire(input);
};
