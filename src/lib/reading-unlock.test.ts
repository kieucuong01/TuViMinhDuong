import { describe, expect, it, vi } from "vitest";
import { generateTuViChart, type TuViChart } from "@/lib/chart";
import { unlockReadingForUser, type ReadingUnlockDeps } from "@/lib/reading-unlock";
import type { ReadingKey } from "@/lib/pricing";
import type { SessionUser } from "@/lib/auth";

function fixtureChart(): TuViChart {
  return generateTuViChart({
    fullName: "Kiều Tấn Cường",
    gender: "male",
    calendarType: "solar",
    day: 7,
    month: 5,
    year: 1995,
    birthHour: 4,
    viewYear: 2026,
    timezone: "Asia/Bangkok",
  });
}

function user(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: "user-1",
    email: "user@example.com",
    name: "Người dùng",
    role: "USER",
    coinBalance: 0,
    ...overrides,
  };
}

function createDeps(options: {
  balance?: number;
  cachedReadingId?: string;
  generateFails?: boolean;
  priceCoins?: number;
} = {}) {
  const chart = fixtureChart();
  let balance = options.balance ?? 0;
  const adjustments: number[] = [];
  const saved: Array<{ priceCoins: number; content: string; promptMeta?: unknown }> = [];
  const priceCoins = options.priceCoins ?? 199;
  const chartId = "chart-1";

  const deps: ReadingUnlockDeps = {
    getChart: vi.fn(async () => ({ id: chartId, chart })),
    getCachedReading: vi.fn(async (userId: string, id: string, type: ReadingKey, scopeKey: string) =>
      options.cachedReadingId
        ? {
            id: options.cachedReadingId,
            userId,
            chartId: id,
            type,
            scopeKey,
            priceCoins,
            content: "cached",
            createdAt: new Date("2026-01-01T00:00:00Z"),
          }
        : null,
    ),
    getFeaturePrice: vi.fn(async () => ({ label: "Luận giải toàn bộ", priceCoins })),
    getUserBalance: vi.fn(async () => balance),
    adjustCoins: vi.fn(async (_user, amount) => {
      balance += amount;
      adjustments.push(amount);
      return balance;
    }),
    generateReading: vi.fn(async () => {
      if (options.generateFails) throw new Error("AI failed");
      return { content: "generated reading", model: "test-model", prompt: "test prompt" };
    }),
    saveReading: vi.fn(async (readingUser, id, type, scopeKey, chargedCoins, content, promptMeta) => {
      saved.push({ priceCoins: chargedCoins, content, promptMeta });
      return {
        id: "reading-1",
        userId: readingUser.id,
        chartId: id,
        type,
        scopeKey,
        priceCoins: chargedCoins,
        content,
        createdAt: new Date("2026-01-01T00:00:00Z"),
      };
    }),
  };

  return {
    chartId,
    deps,
    getBalance: () => balance,
    adjustments,
    saved,
  };
}

describe("reading unlock paywall flow", () => {
  it("blocks normal users when they do not have enough coins", async () => {
    const harness = createDeps({ balance: 120, priceCoins: 199 });

    const result = await unlockReadingForUser(harness.deps, {
      user: user({ coinBalance: 120 }),
      chartId: harness.chartId,
      type: "FULL",
      scopeKey: "all",
    });

    expect(result).toEqual({ status: "insufficient_coins", needCoins: 79, priceCoins: 199, balance: 120 });
    expect(harness.deps.adjustCoins).not.toHaveBeenCalled();
    expect(harness.deps.generateReading).not.toHaveBeenCalled();
    expect(harness.deps.saveReading).not.toHaveBeenCalled();
  });

  it("returns cached readings without charging a second time", async () => {
    const harness = createDeps({ balance: 250, cachedReadingId: "reading-cached" });

    const result = await unlockReadingForUser(harness.deps, {
      user: user({ coinBalance: 250 }),
      chartId: harness.chartId,
      type: "FULL",
      scopeKey: "all",
    });

    expect(result).toEqual({ status: "cached", readingId: "reading-cached", chargedCoins: 0 });
    expect(harness.getBalance()).toBe(250);
    expect(harness.deps.adjustCoins).not.toHaveBeenCalled();
    expect(harness.deps.generateReading).not.toHaveBeenCalled();
  });

  it("charges normal users once when creating a new paid reading", async () => {
    const harness = createDeps({ balance: 250, priceCoins: 199 });

    const result = await unlockReadingForUser(harness.deps, {
      user: user({ coinBalance: 250 }),
      chartId: harness.chartId,
      type: "FULL",
      scopeKey: "all",
    });

    expect(result).toEqual({ status: "created", readingId: "reading-1", chargedCoins: 199 });
    expect(harness.getBalance()).toBe(51);
    expect(harness.adjustments).toEqual([-199]);
    expect(harness.saved[0]).toMatchObject({
      priceCoins: 199,
      content: "generated reading",
    });
  });

  it("allows paid readings only when the user balance covers the full price", async () => {
    const harness = createDeps({ balance: 199, priceCoins: 199 });

    const result = await unlockReadingForUser(harness.deps, {
      user: user({ coinBalance: 199 }),
      chartId: harness.chartId,
      type: "FULL",
      scopeKey: "all",
    });

    expect(result).toEqual({ status: "created", readingId: "reading-1", chargedCoins: 199 });
    expect(harness.getBalance()).toBe(0);
    expect(harness.adjustments).toEqual([-199]);
    expect(harness.deps.generateReading).toHaveBeenCalledTimes(1);
  });

  it("lets admins create paid readings without spending coins", async () => {
    const harness = createDeps({ balance: 0, priceCoins: 199 });

    const result = await unlockReadingForUser(harness.deps, {
      user: user({ id: "admin-1", role: "ADMIN", coinBalance: 0 }),
      chartId: harness.chartId,
      type: "FULL",
      scopeKey: "all",
    });

    expect(result).toEqual({ status: "created", readingId: "reading-1", chargedCoins: 0 });
    expect(harness.deps.getUserBalance).not.toHaveBeenCalled();
    expect(harness.deps.adjustCoins).not.toHaveBeenCalled();
    expect(harness.saved[0]?.priceCoins).toBe(0);
  });

  it("refunds coins if generation fails after debit", async () => {
    const harness = createDeps({ balance: 199, priceCoins: 199, generateFails: true });

    await expect(
      unlockReadingForUser(harness.deps, {
        user: user({ coinBalance: 199 }),
        chartId: harness.chartId,
        type: "FULL",
        scopeKey: "all",
      }),
    ).rejects.toThrow("AI failed");

    expect(harness.getBalance()).toBe(199);
    expect(harness.adjustments).toEqual([-199, 199]);
    expect(harness.deps.saveReading).not.toHaveBeenCalled();
  });
});
