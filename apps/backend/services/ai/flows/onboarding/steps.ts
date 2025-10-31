export type OnboardingStep = {
  age?: number;
  parentCount?: number;
  parentSpecialNeeds?: string[];
  personalChallenges?: string[];
};

export const STEP_ORDER = [
  'age',
  'parentCount',
  'parentSpecialNeeds',
  'personalChallenges',
] as const;

type StepKey = keyof OnboardingStep;

export function promptFor(slot: StepKey): string {
  switch (slot) {
    case 'age':
      return 'First of all, how old are you?';
    case 'parentCount':
      return 'Nice! And how many parents do you have to take care of?';
    case 'parentSpecialNeeds':
      return 'Oh, that must be tough... Do they have any special conditions and/or needs?';
    case 'personalChallenges':
      return "And what are the challenges that you face in your everyday life? Maybe it's balancing work and caregiving, or finding time for yourself?";
    default:
      return 'Could you tell me more?';
  }
}

// guardrails

export function quickValidate(slot: StepKey, value: unknown): boolean {
  switch (slot) {
    case 'age': {
      const n = Number(value);
      return Number.isInteger(n) && n > 0 && n < 120; // age between 1 and 120
    }

    case 'parentCount': {
      const n = Number(value);
      return Number.isInteger(n) && n >= 0 && n < 10; // parent count between 0 and 10 (safe bound)
    }

    case 'parentSpecialNeeds': {
      if (value === null || value === undefined) return false; // optional
      if (Array.isArray(value)) return value.every((v) => typeof v === 'string');
      // allow a single string as well
      return typeof value === 'string';
    }

    case 'personalChallenges': {
      if (!value) return false; // optional
      if (Array.isArray(value))
        return value.length >= 1 && value.length <= 5 && value.every((v) => typeof v === 'string');
    }
    default:
      return true;
  }
}
