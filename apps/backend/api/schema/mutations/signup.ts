import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  age?: number;
  gender?: string;
  avatarUrl?: string;
}

export const signup = async (root: any, { input }: { input: SignupInput }, context: Context) => {
  const { name, email, password, age, gender, avatarUrl } = input;

  if (!name || !email || !password) {
    throw new GraphQLError('Name, email, and password are required');
  }

  if (password.length < 10) {
    throw new GraphQLError('Password must be at least 10 characters long');
  }

  // check if user already exists
  const existingUsers = await context.prisma.user.findMany({
    where: { email: { equals: email } },
  });

  if (existingUsers.length > 0) {
    throw new GraphQLError('User with this email already exists');
  }

  try {
    // create user using Keystone's Prisma context
    const user = await context.prisma.user.create({
      data: {
        name,
        email,
        password, // Keystone will automatically hash this
        age,
        gender,
        avatarUrl,
        privacyToggle: true,
        isAdmin: false,
      },
    });

    // start session for the user using Keystone's built-in session management
    const sessionData = await context.sessionStrategy?.start({
      data: { id: user.id, name: user.name, isAdmin: user.isAdmin },
      context,
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
      token: sessionData || 'session-created',
    };
  } catch (error) {
    console.error('Signup error:', error);
    throw new GraphQLError('Failed to create user');
  }
};
