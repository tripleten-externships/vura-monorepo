import { Context } from '../types/context';

/**
 * Log an audit event for user actions
 * @param context - The Keystone context
 * @param eventType - Type of event being logged
 * @param userId - ID of the user performing the action
 * @param resourceId - ID of the resource being acted upon
 * @param details - Additional details about the event
 */
export async function logAuditEvent(
  context: Context,
  eventType: 'POST_CREATED' | 'POST_DELETED' | 'CHAT_CREATED' | 'MESSAGE_SENT',
  userId: string,
  resourceId: string,
  details?: any
) {
  try {
    // Log to console in development
    console.log('[AUDIT LOG]', {
      timestamp: new Date().toISOString(),
      eventType,
      userId,
      resourceId,
      details,
    });

    // TODO: In production, store audit logs in database
    // await context.sudo().db.AuditLog.createOne({
    //   data: {
    //     eventType,
    //     user: { connect: { id: userId } },
    //     resourceId: resourceId,
    //     timestamp: new Date(),
    //     details: details ? JSON.stringify(details) : null,
    //   },
    // });
  } catch (error) {
    console.error('[AUDIT LOG ERROR]', error);
    // Don't throw the error so operations can continue even if logging fails
  }
}
