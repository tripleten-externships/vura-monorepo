import { GraphQLError } from 'graphql';
import { isEmailValid, isEmailUnique, verifyPassword } from '../../../utils/validation';
import { Context } from '../../../types';

export const updateProfile = async (
  _: unknown,
  { input }: { input: UpdateProfileInput },
  context: Context
): Promise<UpdateProfileResult> => {
  const session = context.session;

  if (!session?.data?.id) {
    throw new GraphQLError('User must be authenticated');
  }

  const { name, email, age, gender, avatarUrl, currentPassword } = input;

  if (!name && !email && !age && !gender && !avatarUrl) {
    throw new GraphQLError('At least one field must be provided for update');
  }

  const updates: Record<string, any> = {};

  if (name) updates.name = name;
  if (age) updates.age = age;
  if (gender) updates.gender = gender;
  if (avatarUrl) updates.avatarUrl = avatarUrl;

  if (email) {
    if (!isEmailValid(email)) {
      throw new GraphQLError('Invalid email format');
    }

    const isUnique = await isEmailUnique(email, context, session.data.id);
    if (!isUnique) {
      throw new GraphQLError('Email already exists');
    }

    if (!currentPassword) {
      throw new GraphQLError('Current password required for email changes');
    }

    const user = await context.db.User.findOne({ where: { id: session.data.id } });
    const isValid = await verifyPassword(currentPassword, user?.password);
    if (!isValid) {
      throw new GraphQLError('Invalid current password');
    }

    updates.email = email;
  }

  try {
    const updatedUser = await context.db.User.updateOne({
      where: { id: session.data.id },
      data: updates,
    });

    // Optional: log audit trail
    await context.db.AuditLog.createOne({
      data: {
        action: 'UPDATE_PROFILE',
        user: { connect: { id: session.data.id } },
        details: JSON.stringify(updates),
      },
    });

    return {
      user: updatedUser,
      message: 'Profile updated successfully',
    };
  } catch (error) {
    throw new GraphQLError('Failed to update profile');
  }
};
