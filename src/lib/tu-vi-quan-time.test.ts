import { describe, expect, it } from "vitest";
import { quanRemainingMs } from "./tu-vi-quan-time";

describe("visit time balance", () => {
  it("spends only a running deadline and keeps a paused balance across days", () => {
    const now = new Date("2026-11-05T10:00:00Z");
    expect(quanRemainingMs({ endsAt: null, outageSince: null, remainingMs: 720_000 }, 900_000, now)).toBe(720_000);
    expect(quanRemainingMs({ endsAt: new Date(now.getTime() + 120_000), outageSince: null, remainingMs: null }, 900_000, now)).toBe(120_000);
    expect(quanRemainingMs({ endsAt: new Date(now.getTime() - 1), outageSince: null, remainingMs: null }, 900_000, now)).toBe(0);
    expect(quanRemainingMs({ endsAt: null, outageSince: null, remainingMs: 0 }, 900_000, now)).toBe(0);
  });
});
