import 'server-only';
import { Redis } from '@upstash/redis';

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfter?: number };

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const redis = getRedis();
  if (!redis) {
    console.warn('[fixit] rate limiting disabled: UPSTASH_REDIS_REST_URL/TOKEN not set');
    return { allowed: true, remaining: limit };
  }

  const windowIndex = Math.floor(Date.now() / (windowSeconds * 1000));
  const kvKey = `rl:${key}:${windowIndex}`;

  const count = await redis.incr(kvKey);
  if (count === 1) {
    await redis.expire(kvKey, windowSeconds + 1);
  }

  const allowed = count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - count),
    retryAfter: allowed ? undefined : windowSeconds,
  };
}
