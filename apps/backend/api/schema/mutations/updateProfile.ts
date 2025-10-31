import { GraphQLError } from 'graphql';
import { isEmailValid, isEmailUnique, verifyPassword } from '../../../utils/validation';
import { Context } from '../../../types/context';

export const updateProfile = async (
  _: unknown,
  { input }: { input: any },
  context: Context
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  userId?: string | null;
}> => {
  const session = context.session;

  console.log('updateProfile called. session=', !!session, session?.data?.id);

  if (!session?.data?.id) {
    return {
      success: false,
      error: 'User must be authenticated',
      userId: null,
    };
  }

  // Quick debug bypass: when DEBUG_UPDATEPROFILE=1 is set in env, return a
  // deterministic payload so we can verify transport/parsing without DB side-effects.
  if (process.env.DEBUG_UPDATEPROFILE === '1') {
    console.log('updateProfile debug-bypass active');
    return {
      success: true,
      message: 'Debug response',
      userId: session?.data?.id ?? null,
    };
  }

  const { name, email, age, gender, avatarUrl, currentPassword } = input;

  if (!name && !email && !age && !gender && !avatarUrl) {
    return {
      success: false,
      error: 'At least one field must be provided for update',
      userId: String(session.data.id),
    };
  }

  const updates: Record<string, any> = {};

  if (name) updates.name = name;
  if (age) updates.age = age;
  if (gender) updates.gender = gender;
  if (avatarUrl) updates.avatarUrl = avatarUrl;

  try {
    // When verifying password we must fetch the hashed password explicitly using
    // Keystone's query API so we can request the 'password' field.
    const dbUser = await context.query.User.findOne({
      where: { id: String(session.data.id) },
      query: 'id name email password { isSet }',
    });
    console.log('Fetched user for updateProfile:', !!dbUser, dbUser?.id);

    if (!dbUser) {
      return {
        success: false,
        error: 'Authenticated user not found',
        userId: String(session.data.id),
      };
    }

    if (email) {
      if (!isEmailValid(email)) {
        return {
          success: false,
          error: 'Invalid email format',
          userId: String(session.data.id),
        };
      }

      const isUnique = await isEmailUnique(email, context, String(session.data.id));
      if (!isUnique) {
        return {
          success: false,
          error: 'Email already exists',
          userId: String(session.data.id),
        };
      }

      if (!currentPassword) {
        return {
          success: false,
          error: 'Current password required for email changes',
          userId: String(session.data.id),
        };
      }

      const isValid = await verifyPassword(
        currentPassword,
        dbUser?.password as string | null | undefined
      );
      console.log(
        'Password compare result for user',
        dbUser?.id,
        ':',
        !!dbUser?.password,
        ' => isValid=',
        isValid
      );
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid current password',
          userId: String(session.data.id),
        };
      }

      updates.email = email;
    }

    const updatedUser = await context.db.User.updateOne({
      where: { id: String(session.data.id) },
      data: updates,
    });

    // Optional: log audit trail
    try {
      await context.db.AuditLog.createOne({
        data: {
          action: 'UPDATE_PROFILE',
          user: { connect: { id: String(session.data.id) } },
          details: JSON.stringify(updates),
        },
      });
    } catch (auditErr: any) {
      console.warn('Failed to write audit log for updateProfile:', auditErr?.message || auditErr);
    }

    // Fetch the updated user fields explicitly and return them in the payload so
    // clients don't need to rely on a separate schema-level resolver (safer).
    let fullUser = null;
    try {
      fullUser = await context.query.User.findOne({
        where: { id: String(updatedUser?.id || session.data.id) },
        query: 'id name email age gender avatarUrl',
      });
      console.log('updateProfile fetched fullUser:', !!fullUser, fullUser?.id);
    } catch (fetchErr: any) {
      console.warn(
        'Failed to fetch updated user after updateProfile:',
        fetchErr?.message || fetchErr
      );
    }

    return {
      success: true,
      message: 'Profile updated successfully',
      userId: String(updatedUser?.id ?? session.data.id),
    };
  } catch (error: any) {
    console.error('updateProfile error:', error?.message || error);
    return {
      success: false,
      error: 'Failed to update profile',
      userId: String(session.data.id),
    };
  }
};
