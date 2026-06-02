import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateTuViChart, type ChartInput } from "@/lib/chart";
import type { SessionUser } from "@/lib/auth";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));
vi.mock("@/lib/db", () => ({ getDb: mocks.getDb }));

const input: ChartInput = {
  fullName: "Kieu Tan Cuong",
  gender: "male",
  calendarType: "solar",
  day: 7,
  month: 5,
  year: 1995,
  birthHour: 4,
  birthMinute: 0,
  viewYear: 2026,
  timezone: "Asia/Bangkok",
};

const user: SessionUser = {
  id: "user-1",
  email: "user@example.com",
  name: "Nguoi dung",
  role: "USER",
  coinBalance: 0,
};

function createDb() {
  return {
    reading: {
      findMany: vi.fn(async () => []),
    },
    chart: {
      findMany: vi.fn(),
      create: vi.fn(async ({ data }: { data: { title: string; input: ChartInput; chart: unknown; userId?: string } }) => ({
        id: "chart-created",
        title: data.title,
        input: data.input,
        chart: data.chart,
        userId: data.userId,
        createdAt: new Date("2026-01-01T00:00:00Z"),
      })),
    },
  };
}

describe("saveChart performance-sensitive duplicate lookup", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("reuses a purchased duplicate by querying completed readings before charts", async () => {
    const db = createDb();
    const chart = generateTuViChart(input);
    db.reading.findMany.mockResolvedValue([
      {
        chart: {
          id: "chart-purchased",
          title: "Purchased chart",
          input: chart.input,
          chart,
          userId: user.id,
          createdAt: new Date("2026-01-02T00:00:00Z"),
        },
      },
    ]);
    mocks.getDb.mockReturnValue(db);

    const { saveChart } = await import("@/lib/data");
    const saved = await saveChart(input, user);

    expect(saved.id).toBe("chart-purchased");
    expect(db.reading.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: user.id, type: "FULL", scopeKey: "all", status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
    }));
    expect(db.chart.findMany).not.toHaveBeenCalled();
    expect(db.chart.create).not.toHaveBeenCalled();
  });

  it("creates a fresh chart when the same input has not been purchased", async () => {
    const db = createDb();
    mocks.getDb.mockReturnValue(db);

    const { saveChart } = await import("@/lib/data");
    const saved = await saveChart(input, user);

    expect(saved.id).toBe("chart-created");
    expect(db.reading.findMany).toHaveBeenCalledTimes(1);
    expect(db.chart.create).toHaveBeenCalledTimes(1);
  });

  it("does not run duplicate lookup for guests", async () => {
    const db = createDb();
    mocks.getDb.mockReturnValue(db);

    const { saveChart } = await import("@/lib/data");
    await saveChart(input, null);

    expect(db.reading.findMany).not.toHaveBeenCalled();
    expect(db.chart.create).toHaveBeenCalledTimes(1);
  });
});
