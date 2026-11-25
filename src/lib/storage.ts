/**
 * Edge-safe geohash cache & gentle IP rate limiter for ROOFWATT.
 *
 * Compatible with Cloudflare Workers (no local filesystem writes).
 * Uses an optional Cloudflare KV namespace when bound, seamlessly falling back
 * to an in-memory isolate cache during local development and DEMO_MODE.
 */

export interface EdgeKVNamespace {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ): Promise<void>;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const memoryRateLimits = new Map<string, RateLimitBucket>();

const DEFAULT_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
export const LIVE_RATE_LIMIT_PER_HOUR = 15;

/**
 * Compute a ~2 km grid key from coordinates + YYYY-MM window so nearby
 * neighbors share cached historical irradiance without redundant x402 calls.
 * (0.02° latitude ≈ 2.2 km)
 */
export function buildSolarGridKey(
  lat: number,
  lon: number,
  monthStamp?: string
): string {
  const latBucket = (Math.round(lat * 50) / 50).toFixed(2);
  const lonBucket = (Math.round(lon * 50) / 50).toFixed(2);
  const month =
    monthStamp ?? new Date().toISOString().slice(0, 7); // YYYY-MM
  return `solar:v1:${latBucket},${lonBucket}:${month}`;
}

export async function getCachedValue<T>(
  key: string,
  kv?: EdgeKVNamespace
): Promise<T | null> {
  if (kv) {
    try {
      const raw = await kv.get(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      // Fall through to in-memory cache
    }
  }

  const hit = memoryCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return hit.value as T;
}

export async function setCachedValue<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_CACHE_TTL_SECONDS,
  kv?: EdgeKVNamespace
): Promise<void> {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });

  // Bound isolate memory gently
  if (memoryCache.size > 200) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }

  if (kv) {
    try {
      await kv.put(key, JSON.stringify(value), {
        expirationTtl: ttlSeconds,
      });
    } catch {
      // Non-fatal in edge isolate
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Gentle IP-based rate limiter (15 live lookups/hour by default).
 * Bypassed in DEMO_MODE so local exploration is unlimited.
 */
export function checkRateLimit(
  clientIp: string,
  limit: number = LIVE_RATE_LIMIT_PER_HOUR
): RateLimitResult {
  const now = Date.now();
  const key = `rl:${clientIp || "anonymous"}`;
  const existing = memoryRateLimits.get(key);

  if (!existing || now > existing.resetAt) {
    const next: RateLimitBucket = {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    };
    memoryRateLimits.set(key, next);
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      resetAt: next.resetAt,
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}
