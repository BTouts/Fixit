import 'server-only';
import { kv } from '@vercel/kv';

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfter?: number };

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.warn('[fixit] rate limiting disabled: KV_REST_API_URL/KV_REST_API_TOKEN not set');
    return { allowed: true, remaining: limit };
  }

  const windowIndex = Math.floor(Date.now() / (windowSeconds * 1000));
  const kvKey = `rl:${key}:${windowIndex}`;

  const count = await kv.incr(kvKey);
  if (count === 1) {
    await kv.expire(kvKey, windowSeconds + 1);
  }

  const remaining = Math.max(0, limit - count);
  const allowed = count <= limit;
  const retryAfter = allowed ? undefined : windowSeconds;

  return { allowed, remaining, retryAfter };
}
