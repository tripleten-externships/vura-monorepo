import { GraphQLError } from 'graphql';

export const userProfileQueries = {
  userProfile: async (_parent: unknown, _args: {}, context: any) => {
    // Catches initial error
    if (!context.session) {
      throw new GraphQLError('You must be logged in to view your profile', {
        extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } },
      }); // throws a GraphQL error if not signed in
    }

    // Return the current user's profile based on the session
    const userId = context.session?.data?.id;

    console.log('SESSION:', context.session.data);

    try {
      const user = await context.db.User.findOne({ where: { id: userId } });

      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND', http: { status: 404 } },
        });
      } // throws a GraphQL error if user not found

      return user;
    } catch (error) {
      // General error catch
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  },
};
