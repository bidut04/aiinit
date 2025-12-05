// packages/lib/src/redis.ts

import { Redis } from '@upstash/redis';
import IORedis from 'ioredis';

// ❌ REMOVE THIS - it runs too early
// if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
//   throw new Error(
//     '❌ Missing Redis credentials! Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your .env file'
//   );
// }



let redisInstance: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisInstance) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        '❌ Missing Redis credentials! Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN'
      );
    }

    redisInstance = new Redis({ url, token });
    console.log('✅ Redis client initialized');
  }
  return redisInstance;
}

export const redis = new Proxy({} as Redis, {
  get(target, prop) {
    const client = getRedisClient();
    const value = client[prop as keyof Redis];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
console.log('🔍 Imported redis:', redis);
console.log('🔍 Type of redis:', typeof redis);
console.log('🔍 Redis constructor:', redis?.constructor?.name);

// Try to call a method to trigger the Proxy
try {
  console.log('🔍 Trying to access redis.get...');
  const testGet = redis.get;
  console.log('🔍 redis.get exists:', !!testGet);
} catch (e) {
  console.error('❌ Error accessing redis.get:', e);
}

// ✅ ioredis instances for pub/sub (lazy initialization)
let publisherInstance: IORedis | null = null;

// Parse Redis URL for ioredis
function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_URL;
  
  if (!url) {
    throw new Error('UPSTASH_REDIS_URL is not defined');
  }

  // Parse the rediss:// URL
  const parsed = new URL(url);
  
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port) || 6379,
    password: parsed.password,
    tls: parsed.protocol === 'rediss:' ? {} : undefined,
    family: 4,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times: number) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  };
}

// Get or create publisher instance
export const getRedisPublisher = (): IORedis => {
  if (!publisherInstance) {
    try {
      const config = getRedisConfig();
      publisherInstance = new IORedis(config);

      publisherInstance.on('error', (error) => {
        console.error('Redis publisher error:', error);
      });

      publisherInstance.on('connect', () => {
        console.log('✅ Redis publisher connected');
      });
    } catch (error) {
      console.error('Failed to initialize Redis publisher:', error);
      throw error;
    }
  }
  return publisherInstance;
};

// Create new subscriber instance (for SSE connections)
export const createRedisSubscriber = (): IORedis => {
  try {
    const config = getRedisConfig();
    const subscriber = new IORedis(config);

    subscriber.on('error', (error) => {
      console.error('Redis subscriber error:', error);
    });

    subscriber.on('connect', () => {
      console.log('✅ Redis subscriber connected');
    });

    return subscriber;
  } catch (error) {
    console.error('Failed to create Redis subscriber:', error);
    throw error;
  }
};

// ✅ Pub/Sub channels
export const CHANNELS = {
  NEW_APPLICATION: 'notifications:new-application',
  APPLICATION_UPDATE: 'notifications:application-update',
  NEW_ORDER: 'orders:new-order',
  ORDER_STATUS_UPDATE: 'orders:status-update',
  RIDER_LOCATION: 'delivery:rider-location',
};

// ✅ Publish notification using ioredis with error handling
export async function publishNotification(channel: string, data: any) {
  try {
    const publisher = getRedisPublisher();
    await publisher.publish(channel, JSON.stringify(data));
    console.log(`✅ Published to ${channel}`);
  } catch (error) {
    console.error('Error publishing notification:', error);
  }
}

// ✅ Unread count (for notification badges)
export async function incrementUnreadCount(userId: string) {
  try {
    await redis.incr(`unread:${userId}`);
  } catch (error) {
    console.error('Error incrementing unread count:', error);
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const count = await redis.get(`unread:${userId}`);
    return Number(count) || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

export async function resetUnreadCount(userId: string) {
  try {
    await redis.del(`unread:${userId}`);
  } catch (error) {
    console.error('Error resetting unread count:', error);
  }
}

// ✅ Form session management
export async function saveFormSession(sessionId: string, data: any, ttl: number = 3600) {
  try {
    await redis.set(`form:${sessionId}`, JSON.stringify(data), { ex: ttl });
  } catch (error) {
    console.error('Error saving form session:', error);
    throw error;
  }
}

export async function getFormSession(sessionId: string) {
  try {
    const data = await redis.get(`form:${sessionId}`);
    return data ? JSON.parse(data as string) : null;
  } catch (error) {
    console.error('Error getting form session:', error);
    return null;
  }
}

export async function deleteFormSession(sessionId: string) {
  try {
    await redis.del(`form:${sessionId}`);
  } catch (error) {
    console.error('Error deleting form session:', error);
    throw error;
  }
}

// ✅ Cleanup function (call this when shutting down)
export async function closeRedisConnections() {
  try {
    if (publisherInstance) {
      await publisherInstance.quit();
      publisherInstance = null;
    }
  } catch (error) {
    console.error('Error closing Redis connections:', error);
  }
}