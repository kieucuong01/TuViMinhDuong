import { normalizeRequestIp } from "@/lib/chart-submission-guard";

export type RateLimitOptions = {
  limit: number;
  windowMs: number;
  now?: number;
};

export type RateLimitResult = {
  rateLimited: boolean;
  remaining: number;
  resetAt: Date;
};

type Bucket = {
  count: number;
  resetAtMs: number;
};

const buckets = new Map<string, Bucket>();

export const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_RATE_LIMIT = 10;
export const MAGIC_LOGIN_RATE_LIMIT = 20;

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = options.now ?? Date.now();
  const existing = buckets.get(key);
  const bucket =
    existing && existing.resetAtMs > now
      ? existing
      : { count: 0, resetAtMs: now + options.windowMs };

  if (bucket.count >= options.limit) {
    buckets.set(key, bucket);
    return {
      rateLimited: true,
      remaining: 0,
      resetAt: new Date(bucket.resetAtMs),
    };
  }

  bucket.count += 1;
  buckets.set(key, bucket);
  return {
    rateLimited: false,
    remaining: Math.max(options.limit - bucket.count, 0),
    resetAt: new Date(bucket.resetAtMs),
  };
}

export function clearRateLimitBucket(key: string) {
  buckets.delete(key);
}

export function rateLimitKeyFromHeaders(scope: string, headers: Pick<Headers, "get">): string {
  const ip = normalizeRequestIp(
    headers.get("x-forwarded-for") ||
      headers.get("x-real-ip") ||
      headers.get("cf-connecting-ip") ||
      headers.get("x-client-ip"),
  );
  return `auth:${scope}:${ip || "anonymous"}`;
}
