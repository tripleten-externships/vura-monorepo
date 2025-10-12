// Basic validation helpers used by API mutations.
// Keep these simple and sync with project requirements. They can be expanded later.

import { Context } from '../types/context';
import bcrypt from 'bcryptjs';

export function isEmailValid(email: string): boolean {
  // naive check, project may use a more robust validator
  return typeof email === 'string' && /\S+@\S+\.\S+/.test(email);
}

export async function isEmailUnique(
  email: string,
  context: any,
  excludeUserId?: string
): Promise<boolean> {
  if (!email) return false;
  // Attempt to use Keystone/Prisma DB layer if available
  try {
    const existing = await context.db.User.findOne({ where: { email } });
    if (!existing) return true;
    if (excludeUserId && existing.id === excludeUserId) return true;
    return false;
  } catch (err) {
    // If DB isn't reachable here, be conservative and return false
    return false;
  }
}

export async function verifyPassword(plain: string, hashed?: string | null): Promise<boolean> {
  if (!hashed) return false;
  return bcrypt.compare(plain, hashed);
}
