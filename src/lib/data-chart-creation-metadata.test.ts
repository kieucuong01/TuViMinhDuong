import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChartInput } from "@/lib/chart";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));
vi.mock("@/lib/db", () => ({ getDb: mocks.getDb }));

const chartInput: ChartInput = {
  fullName: "Nguyen Van A",
  gender: "male",
  calendarType: "solar",
  day: 10,
  month: 5,
  year: 1990,
  birthHour: 7,
  birthMinute: 0,
  viewYear: 2026,
  timezone: "Asia/Bangkok",
};

describe("chart creation metadata", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("persists request IP and user agent when saving a chart", async () => {
    const db = {
      chart: {
        create: vi.fn(async ({ data }) => ({
          id: "chart-1",
          title: data.title,
          input: data.input,
          chart: data.chart,
          userId: data.userId,
          createdAt: new Date("2026-07-01T01:00:00Z"),
        })),
      },
    };
    mocks.getDb.mockReturnValue(db);

    const { saveChart } = await import("@/lib/data");
    await saveChart(chartInput, null, {
      requestIp: "203.0.113.10",
      userAgent: "Mozilla/5.0 Test",
    });

    expect(db.chart.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        creationIp: "203.0.113.10",
        creationUserAgent: "Mozilla/5.0 Test",
      }),
    }));
  });

  it("counts recent charts by request IP for rate limiting", async () => {
    const since = new Date("2026-07-01T00:50:00Z");
    const db = {
      chart: {
        count: vi.fn(async () => 7),
      },
    };
    mocks.getDb.mockReturnValue(db);

    const { countRecentChartsForIp } = await import("@/lib/data");
    await expect(countRecentChartsForIp("203.0.113.10", since)).resolves.toBe(7);
    expect(db.chart.count).toHaveBeenCalledWith({
      where: {
        creationIp: "203.0.113.10",
        createdAt: { gte: since },
      },
    });
  });
});
