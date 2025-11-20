export interface QuestionResponseInput {
  questionId: string;
  answer: any;
  confidence?: number;
  notes?: string;
}

export interface SaveQuestionnaireResponseInput {
  questionnaireId: string;
  carePlanId?: string;
  checklistId?: string;
  responses: QuestionResponseInput[];
  isDraft?: boolean;
}

export interface SaveQuestionnaireResponseResult {
  questionnaireResponseId: string;
  message: string;
  completionPercentage: number;
  carePlanUpdated: boolean;
  checklistUpdated: boolean;
}

export interface SubmitQuestionnaireInput {
  questionnaireResponseId: string;
  updateCarePlanProgress?: boolean;
}

export interface SubmitQuestionnaireResult {
  questionnaireResponseId: string;
  message: string;
  completedAt: Date;
  carePlanProgressScore?: number;
  checklistCompletionScore?: number;
}

export interface AssignQuestionnaireInput {
  questionnaireId: string;
  assignedToId: string;
  carePlanId?: string;
}

export interface QuestionnaireAssignmentPayload {
  id: string;
  questionnaire?: any;
  assignedTo?: any;
  carePlan?: any;
  [key: string]: any;
}

export interface AssignQuestionnaireResult {
  success: boolean;
  message: string;
  assignment: QuestionnaireAssignmentPayload;
}
