import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));

vi.mock("@/lib/db", () => ({ getDb: mocks.getDb }));

import {
  authRateLimitKeyFromHeaders,
  checkAuthRateLimit,
  checkRateLimit,
  cleanupExpiredRateLimitBuckets,
  clearRateLimitBucket,
  rateLimitKeyFromHeaders,
} from "@/lib/rate-limit";

beforeEach(() => {
  mocks.getDb.mockReset().mockReturnValue(null);
});

describe("checkRateLimit", () => {
  it("allows requests up to the limit and rejects the next one in the same window", () => {
    clearRateLimitBucket("auth:login:203.0.113.10");

    const first = checkRateLimit("auth:login:203.0.113.10", {
      limit: 2,
      windowMs: 60_000,
      now: 1_000,
    });
    const second = checkRateLimit("auth:login:203.0.113.10", {
      limit: 2,
      windowMs: 60_000,
      now: 2_000,
    });
    const third = checkRateLimit("auth:login:203.0.113.10", {
      limit: 2,
      windowMs: 60_000,
      now: 3_000,
    });

    expect(first.rateLimited).toBe(false);
    expect(first.remaining).toBe(1);
    expect(second.rateLimited).toBe(false);
    expect(second.remaining).toBe(0);
    expect(third.rateLimited).toBe(true);
    expect(third.remaining).toBe(0);
    expect(third.resetAt.getTime()).toBe(61_000);
  });

  it("starts a new bucket after the rate-limit window expires", () => {
    clearRateLimitBucket("auth:magic:198.51.100.2");

    checkRateLimit("auth:magic:198.51.100.2", {
      limit: 1,
      windowMs: 60_000,
      now: 1_000,
    });
    const limited = checkRateLimit("auth:magic:198.51.100.2", {
      limit: 1,
      windowMs: 60_000,
      now: 2_000,
    });
    const afterWindow = checkRateLimit("auth:magic:198.51.100.2", {
      limit: 1,
      windowMs: 60_000,
      now: 61_001,
    });

    expect(limited.rateLimited).toBe(true);
    expect(afterWindow.rateLimited).toBe(false);
    expect(afterWindow.remaining).toBe(0);
  });
});

describe("rateLimitKeyFromHeaders", () => {
  it("uses the first forwarded IP and keeps keys scoped", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 198.51.100.9",
    });

    expect(rateLimitKeyFromHeaders("login", headers)).toBe("auth:login:203.0.113.10");
  });

  it("falls back to a stable anonymous key when no client IP is available", () => {
    expect(rateLimitKeyFromHeaders("magic", new Headers())).toBe("auth:magic:anonymous");
  });
});

describe("database-backed auth rate limiting", () => {
  it("uses a stable HMAC key and never exposes the normalized IP", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.10, 198.51.100.9" });
    const first = authRateLimitKeyFromHeaders("login", headers, "test-secret");
    const second = authRateLimitKeyFromHeaders("login", headers, "test-secret");

    expect(first).toBe(second);
    expect(first).toMatch(/^auth:login:[a-f0-9]{64}$/);
    expect(first).not.toContain("203.0.113.10");
  });

  it("atomically increments a shared fixed-window bucket", async () => {
    const upsert = vi.fn().mockResolvedValue({ count: 3 });
    const deleteMany = vi.fn().mockResolvedValue({ count: 0 });
    mocks.getDb.mockReturnValue({ rateLimitBucket: { upsert, deleteMany } });

    const result = await checkAuthRateLimit("login", new Headers({ "x-real-ip": "203.0.113.11" }), {
      limit: 2,
      windowMs: 60_000,
      now: 125_000,
      hmacSecret: "test-secret",
    });

    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { keyHash_windowStart: expect.objectContaining({ windowStart: new Date(120_000) }) },
      create: expect.objectContaining({ count: 1, expiresAt: new Date(240_000) }),
      update: expect.objectContaining({ count: { increment: 1 } }),
    }));
    expect(result).toMatchObject({ rateLimited: true, remaining: 0, shared: true });
  });

  it("falls back to the local bucket only when no database is configured", async () => {
    const headers = new Headers({ "x-real-ip": "198.51.100.80" });
    const first = await checkAuthRateLimit("fallback-test", headers, {
      limit: 1,
      windowMs: 60_000,
      now: 1_000,
      hmacSecret: "test-secret",
    });
    const second = await checkAuthRateLimit("fallback-test", headers, {
      limit: 1,
      windowMs: 60_000,
      now: 2_000,
      hmacSecret: "test-secret",
    });

    expect(first).toMatchObject({ rateLimited: false, shared: false });
    expect(second).toMatchObject({ rateLimited: true, shared: false });
  });

  it("fails closed when the configured shared store is unavailable", async () => {
    mocks.getDb.mockReturnValue({
      rateLimitBucket: {
        upsert: vi.fn().mockRejectedValue(new Error("database unavailable")),
        deleteMany: vi.fn(),
      },
    });

    await expect(checkAuthRateLimit("login", new Headers(), {
      limit: 10,
      windowMs: 60_000,
      now: 1_000,
      hmacSecret: "test-secret",
    })).resolves.toMatchObject({ rateLimited: true, remaining: 0, shared: true, storeUnavailable: true });
  });

  it("deletes expired buckets without touching active windows", async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 4 });
    await expect(cleanupExpiredRateLimitBuckets({ rateLimitBucket: { deleteMany } }, new Date(60_000))).resolves.toBe(4);
    expect(deleteMany).toHaveBeenCalledWith({ where: { expiresAt: { lt: new Date(60_000) } } });
  });
});
