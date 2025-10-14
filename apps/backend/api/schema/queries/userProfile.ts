import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';

export const userProfile = async (root: any, args: any, context: Context) => {
  // check if user is authenticated
  if (!context.session?.data?.id) {
    throw new GraphQLError('You must be logged in to view your profile', {
      extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } },
    });
  }

  try {
    // get the current user's profile
    const user = await context.prisma.user.findUnique({
      where: { id: context.session.data.id },
    });

    if (!user) {
      throw new GraphQLError('User not found', {
        extensions: { code: 'NOT_FOUND', http: { status: 404 } },
      });
    }

    return user;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new GraphQLError('Failed to fetch user profile', {
      extensions: { code: 'INTERNAL_SERVER_ERROR', http: { status: 500 } },
    });
  }
};
