import validator from 'validator';
import { Context } from '../../types';
import bcrypt from 'bcryptjs';

export const isEmailValid = (email: string): boolean => {
  return validator.isEmail(email);
};

export const isEmailUnique = async (
  email: string,
  context: Context,
  currentUserId: string
): Promise<boolean> => {
  const existing = await context.db.User.findMany({
    where: { email: { equals: email } },
  });
  return existing.every((user) => user.id === currentUserId);
};

export const verifyPassword = async (
  inputPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(inputPassword, hashedPassword);
};
