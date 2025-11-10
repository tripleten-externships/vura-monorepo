import EventEmitter from 'eventemitter3';
import { WebSocketService } from '../websocket';

type CarePlanEventTypes = 'created' | 'updated' | 'deleted';

export interface CarePlanEventPayload {
  id: string;
  action: CarePlanEventTypes;
  data: any;
}
// Each CRUD operation (createCarePlan, updateCarePlan, deleteCarePlan) emits events after the database call resolves
// Class for encapsulation and readability
// emitter for carplans only
// used a class so event emmiter is -- typed isolated extensible and globally sharable
class CarePlanEmitter extends EventEmitter<
  Record<CarePlanEventTypes, (payload: CarePlanEventPayload) => void>
> {}

export const carePlanEmitter = new CarePlanEmitter();
export async function createCarePlan(
  data: any,
  context: { db: { CarePlan: { createOne: (arg0: { data: any }) => any } } }
) {
  const carePlan = await context.db.CarePlan.createOne({ data });

  // Emit event after creation
  carePlanEmitter.emit('created', {
    id: carePlan.id,
    action: 'created',
    data: carePlan,
  });

  return carePlan;
}

export async function updateCarePlan(
  id: any,
  data: any,
  context: { db: { CarePlan: { updateOne: (arg0: { where: { id: any }; data: any }) => any } } }
) {
  const updated = await context.db.CarePlan.updateOne({
    where: { id },
    data,
  });

  carePlanEmitter.emit('updated', {
    id,
    action: 'updated',
    data: updated,
  });

  return updated;
}

export async function deleteCarePlan(
  id: any,
  context: { db: { CarePlan: { deleteOne: (arg0: { where: { id: any } }) => any } } }
) {
  const deleted = await context.db.CarePlan.deleteOne({ where: { id } });

  carePlanEmitter.emit('deleted', {
    id,
    action: 'deleted',
    data: deleted,
  });

  return deleted;
}
