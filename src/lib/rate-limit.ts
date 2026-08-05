import { createHmac } from "node:crypto";
import { normalizeRequestIp } from "@/lib/chart-submission-guard";
import { getDb } from "@/lib/db";

export type RateLimitOptions = {
  limit: number;
  windowMs: number;
  now?: number;
};

export type RateLimitResult = {
  rateLimited: boolean;
  remaining: number;
  resetAt: Date;
  shared?: boolean;
  storeUnavailable?: boolean;
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

type RateLimitBucketStore = {
  rateLimitBucket: {
    upsert(args: {
      where: { keyHash_windowStart: { keyHash: string; windowStart: Date } };
      create: { keyHash: string; windowStart: Date; count: number; expiresAt: Date };
      update: { count: { increment: number }; expiresAt: Date };
      select: { count: true };
    }): Promise<{ count: number }>;
    deleteMany(args: { where: { expiresAt: { lt: Date } } }): Promise<{ count: number }>;
  };
};

function rateLimitHmacSecret() {
  const configured = process.env.RATE_LIMIT_HMAC_KEY || process.env.AUTH_SECRET;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") throw new Error("RATE_LIMIT_HMAC_KEY or AUTH_SECRET is required");
  return "dev-rate-limit-secret-change-me";
}

function normalizedIpFromHeaders(headers: Pick<Headers, "get">) {
  return normalizeRequestIp(
    headers.get("x-forwarded-for") ||
      headers.get("x-real-ip") ||
      headers.get("cf-connecting-ip") ||
      headers.get("x-client-ip"),
  ) || "anonymous";
}

export function authRateLimitKeyFromHeaders(
  scope: string,
  headers: Pick<Headers, "get">,
  hmacSecret = rateLimitHmacSecret(),
) {
  const digest = createHmac("sha256", hmacSecret)
    .update(`${scope}:${normalizedIpFromHeaders(headers)}`)
    .digest("hex");
  return `auth:${scope}:${digest}`;
}

export async function cleanupExpiredRateLimitBuckets(db: RateLimitBucketStore, now = new Date()) {
  const result = await db.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: now } } });
  return result.count;
}

let lastCleanupAtMs = 0;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

export async function checkAuthRateLimit(
  scope: string,
  headers: Pick<Headers, "get">,
  options: RateLimitOptions & { hmacSecret?: string },
): Promise<RateLimitResult> {
  const nowMs = options.now ?? Date.now();
  const windowMs = Math.max(1_000, Math.trunc(options.windowMs));
  const windowStartMs = Math.floor(nowMs / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs);
  const resetAt = new Date(windowStartMs + windowMs);
  let key: string;
  try {
    key = authRateLimitKeyFromHeaders(scope, headers, options.hmacSecret);
  } catch {
    return { rateLimited: true, remaining: 0, resetAt, shared: true, storeUnavailable: true };
  }

  let db: RateLimitBucketStore | null;
  try {
    db = getDb() as unknown as RateLimitBucketStore | null;
  } catch {
    return { rateLimited: true, remaining: 0, resetAt, shared: true, storeUnavailable: true };
  }
  if (!db?.rateLimitBucket) {
    return { ...checkRateLimit(key, { ...options, windowMs, now: nowMs }), shared: false };
  }

  try {
    const expiresAt = new Date(resetAt.getTime() + windowMs);
    const bucket = await db.rateLimitBucket.upsert({
      where: { keyHash_windowStart: { keyHash: key, windowStart } },
      create: { keyHash: key, windowStart, count: 1, expiresAt },
      update: { count: { increment: 1 }, expiresAt },
      select: { count: true },
    });
    if (nowMs - lastCleanupAtMs >= CLEANUP_INTERVAL_MS) {
      lastCleanupAtMs = nowMs;
      await cleanupExpiredRateLimitBuckets(db, new Date(nowMs)).catch(() => 0);
    }
    return {
      rateLimited: bucket.count > options.limit,
      remaining: Math.max(options.limit - bucket.count, 0),
      resetAt,
      shared: true,
    };
  } catch {
    return { rateLimited: true, remaining: 0, resetAt, shared: true, storeUnavailable: true };
  }
}
