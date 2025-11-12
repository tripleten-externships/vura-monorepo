import Redis from 'ioredis';

let client: Redis | null = null;

export function getRedisClient(): Redis {
  if (client) return client;
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error('REDIS_URL is not set');
  }
  client = new Redis(url);
  return client;
}

export function getUnreadKey(userId: string): string {
  return `notif:unread:${userId}`;
}
