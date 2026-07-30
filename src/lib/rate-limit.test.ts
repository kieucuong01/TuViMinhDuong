import { describe, expect, it } from "vitest";
import {
  checkRateLimit,
  clearRateLimitBucket,
  rateLimitKeyFromHeaders,
} from "@/lib/rate-limit";

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
