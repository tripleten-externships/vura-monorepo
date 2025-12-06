import { GraphQLError } from 'graphql';
import { BaseService, ServiceDependencies } from '../core';

/**
 * user profile specific helper so graphql queries stay thin and future profile mutations can reuse
 * the same validation/audit logic in one place.
 */
export class UserProfileService extends BaseService {
  constructor(deps: ServiceDependencies) {
    super(deps);
  }

  async getCurrentUser(userId: string) {
    if (!userId) {
      throw new GraphQLError('user id is required', { extensions: { code: 'UNAUTHENTICATED' } });
    }

    const user = await this.context.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new GraphQLError('user not found', { extensions: { code: 'NOT_FOUND' } });
    }

    return user;
  }

  async deleteUser(userId: string) {
    if (!userId) {
      throw new GraphQLError('user id is required', { extensions: { code: 'UNAUTHENTICATED' } });
    }

    try {
      await this.context.prisma.user.delete({
        where: { id: userId },
      });

      return {
        success: true,
        message: 'User account deleted successfully',
      };
    } catch (error) {
      console.error('Delete user error:', error);
      throw new GraphQLError('Failed to delete user account', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  }
}
