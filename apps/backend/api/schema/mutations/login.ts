// Login -> JWT/session
import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../../utils/jwt';

export interface LoginInput {
  email: string;
  password: string;
}

// Stores the record of login attempts
const loginAttempts: Record<string, number> = {};

// Max number of login attempts
const maxNumberLogin = 5;

// Created a function to check for maximum login attempts
function checkLoginAttempts(email: string) {
  if (loginAttempts[email] >= maxNumberLogin) {
    throw new GraphQLError('Too many login attempts. Please try again later');
  }
}

export const login = async (root: any, { input }: { input: LoginInput }, context: Context) => {
  const { email, password } = input;

  // If there is no login record, create one.
  if (!loginAttempts[email]) loginAttempts[email] = 0;

  // Check missing required fields
  if (!email || !password) {
    loginAttempts[email]++;
    checkLoginAttempts(email);
    throw new GraphQLError('Email and password are required');
  }

  // Check if user doesn't exist
  const user = await context.prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    loginAttempts[email]++;
    checkLoginAttempts(email);
    throw new GraphQLError('Account not found');
  }

  // Check for incorrect credentials
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    loginAttempts[email]++;
    checkLoginAttempts(email);
    throw new GraphQLError('invalid password');
  }

  // When login is successful or after reaching max attempts, reset count to 0.
  loginAttempts[email] = 0;

  // try {
  //   const sessionData = await context.sessionStrategy?.start({
  //     data: { email: user.email },
  //     context,
  //   });

  try {
    // Generate JWT token here
    const token = generateToken(user);

    // Optionally update last login date
    await context.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginDate: new Date() },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        age: user.age,
        gender: user.gender,
        privacyToggle: user.privacyToggle,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        lastLoginDate: user.lastLoginDate,
        lastUpdateDate: user.lastUpdateDate,
      },
      token,
    };
  } catch (error) {
    console.error('Login error:', error);
    throw new GraphQLError('Login Failed');
  }
};
