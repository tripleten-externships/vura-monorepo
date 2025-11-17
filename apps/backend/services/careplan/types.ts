import { Context } from '../../types/context';

export interface CreateCarePlanInput {
  name: string;
  progressScore?: number;
  userId?: string;
}

export interface UpdateCarePlanInput {
  name?: string;
  progressScore?: number;
  lastAssessmentDate?: Date;
}

// assign questionnaire input
export interface AssignQuestionnairesInput {
  carePlanId: string;
  questionnaireIds: string[];
}

// ICarePlanService
export interface ICarePlanService {
  createCarePlan(data: CreateCarePlanInput, context: Context): Promise<any>;
  updateCarePlan(carePlanId: string, data: UpdateCarePlanInput, context: Context): Promise<any>;
  assignQuestionnaires(data: AssignQuestionnairesInput, context: Context): Promise<any>;
}
