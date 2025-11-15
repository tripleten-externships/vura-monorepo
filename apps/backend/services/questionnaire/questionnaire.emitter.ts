import EventEmitter from 'eventemitter3';
// sets up an event emitter you can listen to for assigned and completed events.
type QuestionnaireEventTypes = 'assigned' | 'completed';

export interface QuestionnaireEventPayload {
  id: string;
  data: any;
}

class QuestionnaireEmitter extends EventEmitter<
  Record<QuestionnaireEventTypes, (payload: QuestionnaireEventPayload) => void>
> {}

export const questionnaireEmitter = new QuestionnaireEmitter();
