import { OnboardingStep, STEP_ORDER, promptFor, quickValidate } from './steps';

export class FlowEngine {
  nextMissingSlot(slots: OnboardingStep): keyof OnboardingStep | null {
    for (const key of STEP_ORDER) {
      if (
        slots[key] === undefined ||
        slots[key] === null ||
        (Array.isArray(slots[key]) && (slots[key] as unknown[]).length === 0)
      ) {
        return key;
      }
    }
    return null;
  }

  promptFor(slot: keyof OnboardingStep) {
    return promptFor(slot);
  }

  validate(slot: keyof OnboardingStep, value: unknown) {
    return quickValidate(slot, value);
  }
}
