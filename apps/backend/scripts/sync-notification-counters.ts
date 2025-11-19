/**
 * one-time script to initialize notification counters from existing notifications
 * run this after deploying the NotificationCounter table
 *
 * Usage:
 *   npx ts-node scripts/sync-notification-counters.ts
 */

import { PrismaClient } from '@prisma/client';
import { syncCountersFromNotifications } from '../services/cache/db-cache';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting notification counter sync...\n');

  try {
    const users = await prisma.user.findMany({
      where: {
        notifications: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    console.log(`Found ${users.length} users with notifications\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        console.log(`Syncing counters for: ${user.email || user.id}`);
        await syncCountersFromNotifications(user.id);
        successCount++;
        console.log(` Success\n`);
      } catch (error) {
        errorCount++;
        console.error(` Failed: ${error}\n`);
      }
    }

    console.log('SYNC SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`Total users processed: ${users.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${errorCount} `);
    console.log('═══════════════════════════════════════\n');

    const totalCounters = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM NotificationCounter
    `;

    console.log(`Total counters created: ${totalCounters[0].count}`);
    console.log('\nSync complete\n');
  } catch (error) {
    console.error('Fatal error during sync:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
