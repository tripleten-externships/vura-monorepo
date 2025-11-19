import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

/**
 * Database-based counter cache using MySQL
 * Fast, persistent, multi-instance safe alternative to Redis
 */

type NotificationType = 'CARE_PLAN' | 'CHAT' | 'FORUM' | 'SYSTEM';

/**
 * Increment a notification counter atomically
 * Uses MySQL's atomic operations to prevent race conditions
 */
export async function incrementCounter(
  prisma: PrismaClient,
  userId: string,
  notificationType: NotificationType
): Promise<number> {
  try {
    // Use upsert with atomic increment
    // This is a single database operation, very fast with proper indexing
    const result = await prisma.$executeRaw`
      INSERT INTO NotificationCounter (id, userId, notificationType, count, lastUpdated)
      VALUES (
        CONCAT(${userId}, '-', ${notificationType}),
        ${userId},
        ${notificationType},
        1,
        NOW(3)
      )
      ON DUPLICATE KEY UPDATE
        count = count + 1,
        lastUpdated = NOW(3)
    `;

    // Get the updated count
    const counter = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT count FROM NotificationCounter
      WHERE userId = ${userId} AND notificationType = ${notificationType}
    `;

    const newCount = counter[0]?.count || 1;
    logger.debug('Counter incremented', { userId, notificationType, newCount });
    return newCount;
  } catch (error) {
    logger.error('Failed to increment counter', { error, userId, notificationType });
    throw error;
  }
}

/**
 * Decrement a notification counter atomically
 * Ensures count never goes below zero
 */
export async function decrementCounter(
  prisma: PrismaClient,
  userId: string,
  notificationType: NotificationType
): Promise<number> {
  try {
    // Atomic decrement with lower bound check
    await prisma.$executeRaw`
      UPDATE NotificationCounter
      SET count = GREATEST(0, count - 1),
          lastUpdated = NOW(3)
      WHERE userId = ${userId} 
        AND notificationType = ${notificationType}
    `;

    // Get the updated count
    const counter = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT count FROM NotificationCounter
      WHERE userId = ${userId} AND notificationType = ${notificationType}
    `;

    const newCount = counter[0]?.count || 0;
    logger.debug('Counter decremented', { userId, notificationType, newCount });
    return newCount;
  } catch (error) {
    logger.error('Failed to decrement counter', { error, userId, notificationType });
    throw error;
  }
}

/**
 * Get total unread count for a user across all notification types
 * Uses covering index for maximum performance
 */
export async function getTotalUnreadCount(prisma: PrismaClient, userId: string): Promise<number> {
  try {
    const result = await prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT COALESCE(SUM(count), 0) as total
      FROM NotificationCounter
      WHERE userId = ${userId}
    `;

    const total = Number(result[0]?.total || 0);
    logger.debug('Total unread count retrieved', { userId, total });
    return total;
  } catch (error) {
    logger.error('Failed to get total unread count', { error, userId });
    throw error;
  }
}

/**
 * Get unread count for a specific notification type
 * Single index lookup - extremely fast
 */
export async function getUnreadCountByType(
  prisma: PrismaClient,
  userId: string,
  notificationType: NotificationType
): Promise<number> {
  try {
    const counter = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COALESCE(count, 0) as count
      FROM NotificationCounter
      WHERE userId = ${userId} 
        AND notificationType = ${notificationType}
    `;

    const count = counter[0]?.count || 0;
    logger.debug('Unread count by type retrieved', { userId, notificationType, count });
    return count;
  } catch (error) {
    logger.error('Failed to get unread count by type', { error, userId, notificationType });
    throw error;
  }
}

/**
 * Reset all counters for a user to zero
 * Used when marking all notifications as read
 */
export async function resetAllCounters(prisma: PrismaClient, userId: string): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE NotificationCounter
      SET count = 0,
          lastUpdated = NOW(3)
      WHERE userId = ${userId}
    `;

    logger.info('All counters reset', { userId });
  } catch (error) {
    logger.error('Failed to reset counters', { error, userId });
    throw error;
  }
}

/**
 * Initialize or sync counters from actual notification counts
 * Useful for recovering from inconsistencies or initial setup
 */
export async function syncCountersFromNotifications(
  prisma: PrismaClient,
  userId: string
): Promise<void> {
  try {
    // Get actual counts from notifications table
    const actualCounts = await prisma.$queryRaw<Array<{ notificationType: string; count: bigint }>>`
      SELECT notificationType, COUNT(*) as count
      FROM Notification
      WHERE userId = ${userId} 
        AND read = false
      GROUP BY notificationType
    `;

    // Update counters to match actual counts
    for (const row of actualCounts) {
      await prisma.$executeRaw`
        INSERT INTO NotificationCounter (id, userId, notificationType, count, lastUpdated)
        VALUES (
          CONCAT(${userId}, '-', ${row.notificationType}),
          ${userId},
          ${row.notificationType},
          ${Number(row.count)},
          NOW(3)
        )
        ON DUPLICATE KEY UPDATE
          count = ${Number(row.count)},
          lastUpdated = NOW(3)
      `;
    }

    logger.info('Counters synced from notifications', { userId, types: actualCounts.length });
  } catch (error) {
    logger.error('Failed to sync counters', { error, userId });
    throw error;
  }
}

/**
 * Clean up stale counters (optional maintenance function)
 * Remove counters that haven't been updated in a long time and are zero
 */
export async function cleanupStaleCounters(
  prisma: PrismaClient,
  daysOld: number = 90
): Promise<number> {
  try {
    const result = await prisma.$executeRaw`
      DELETE FROM NotificationCounter
      WHERE count = 0
        AND lastUpdated < DATE_SUB(NOW(), INTERVAL ${daysOld} DAY)
    `;

    logger.info('Stale counters cleaned up', { deleted: result });
    return typeof result === 'number' ? result : 0;
  } catch (error) {
    logger.error('Failed to cleanup stale counters', { error });
    throw error;
  }
}
