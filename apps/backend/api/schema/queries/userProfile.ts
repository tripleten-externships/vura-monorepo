import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';

export const userProfile = async (root: any, args: any, context: Context) => {
  // check if user is authenticated
  if (!context.session?.data?.id) {
    throw new GraphQLError('You must be logged in to view your profile');
  }

  try {
    // get the current user's profile
    const user = await context.prisma.user.findUnique({
      where: { id: context.session.data.id },
    });

    if (!user) {
      throw new GraphQLError('User not found');
    }

    return user;
  } catch (error) {
    console.error('UserProfile error:', error);
    throw new GraphQLError('Failed to fetch user profile');
  }
};
