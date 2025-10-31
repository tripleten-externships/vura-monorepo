// Types
export type AgeObj = { age: number };
export type ParentCountObj = { parentCount: number };
export type ParentSpecialNeedsObj = { parentSpecialNeeds: string[] };
export type PersonalChallengesObj = { personalChallenges: string[] };

export type SlotKey = 'age' | 'parentCount' | 'parentSpecialNeeds' | 'personalChallenges';

// Coercers

function toIntRange(v: unknown, min: number, max: number): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN;
  const i = Number.isFinite(n) ? Math.trunc(n as number) : NaN;
  if (!Number.isFinite(i)) return null;
  if (i < min || i > max) return null;
  return i;
}

function toStringArray(v: unknown, allowEmpty = true, max = 10): string[] | null {
  if (v === null || v === undefined) return allowEmpty ? [] : null;
  if (Array.isArray(v)) {
    const arr = v
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean);
    return arr.slice(0, max);
  }

  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return allowEmpty ? [] : null;
    if (s.toLowerCase() === 'none') return [];
    const arr = s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    return arr.slice(0, max);
  }

  return allowEmpty ? [] : null;
}

// Field validators

export function validateAge(obj: any): [true, AgeObj] | [false, string] {
  const val = toIntRange(obj?.age, 0, 120);
  return val === null ? [false, 'Age must be an integer between 0 and 120'] : [true, { age: val }];
}

export function validateParentCount(obj: any): [true, ParentCountObj] | [false, string] {
  const val = toIntRange(obj?.parentCount, 0, 10);
  return val === null
    ? [false, 'Parent count must be an integer between 0 and 10']
    : [true, { parentCount: val }];
}

export function validateParentSpecialNeeds(
  obj: any
): [true, ParentSpecialNeedsObj] | [false, string] {
  const val = toStringArray(obj?.parentSpecialNeeds, true, 10);
  return val === null
    ? [false, 'Parent special needs must be a comma-separated list or array of strings']
    : [true, { parentSpecialNeeds: val }];
}

export function validatePersonalChallenges(
  obj: any
): [true, PersonalChallengesObj] | [false, string] {
  const val = toStringArray(obj?.personalChallenges, false, 10);
  return val === null || val.length === 0
    ? [false, 'Personal challenges must have at least one entry']
    : [true, { personalChallenges: val }];
}

// Single-field helpers

export type FieldValidator =
  | ((obj: any) => [true, AgeObj] | [false, string])
  | ((obj: any) => [true, ParentCountObj] | [false, string])
  | ((obj: any) => [true, ParentSpecialNeedsObj] | [false, string])
  | ((obj: any) => [true, PersonalChallengesObj] | [false, string]);

export function validatorFor(slot: SlotKey): FieldValidator {
  switch (slot) {
    case 'age':
      return validateAge;
    case 'parentCount':
      return validateParentCount;
    case 'parentSpecialNeeds':
      return validateParentSpecialNeeds;
    case 'personalChallenges':
      return validatePersonalChallenges;
  }
}
