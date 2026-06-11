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

const guestInput: ChartInput = {
  fullName: "Khach vang lai",
  gender: "female",
  calendarType: "solar",
  day: 12,
  month: 8,
  year: 1992,
  birthHour: 9,
  birthMinute: 15,
  viewYear: 2026,
  timezone: "Asia/Bangkok",
};

const userInput: ChartInput = {
  fullName: "Nguyen Van A",
  gender: "male",
  calendarType: "lunar",
  day: 23,
  month: 4,
  year: 1994,
  birthHour: 3,
  birthMinute: 0,
  viewYear: 2026,
  timezone: "Asia/Bangkok",
};

describe("admin chart submissions", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("lists submitted chart forms for guests and logged-in users", async () => {
    const db = {
      chart: {
        findMany: vi.fn(async () => [
          {
            id: "chart-guest",
            title: "La so khach",
            input: guestInput,
            userId: null,
            createdAt: new Date("2026-06-10T08:00:00Z"),
            user: null,
          },
          {
            id: "chart-user",
            title: "La so user",
            input: userInput,
            userId: "user-1",
            createdAt: new Date("2026-06-09T08:00:00Z"),
            user: { id: "user-1", email: "user@example.com", name: "Nguoi dung" },
          },
        ]),
      },
    };
    mocks.getDb.mockReturnValue(db);

    const { listAdminChartSubmissions } = await import("@/lib/data");
    const submissions = await listAdminChartSubmissions();

    expect(db.chart.findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: { createdAt: "desc" },
      take: 80,
      select: expect.objectContaining({
        id: true,
        input: true,
        userId: true,
        user: expect.any(Object),
      }),
    }));
    expect(submissions).toHaveLength(2);
    expect(submissions[0]).toMatchObject({
      id: "chart-guest",
      submitterType: "guest",
      userId: null,
      userEmail: null,
      fullName: "Khach vang lai",
      gender: "female",
      calendarType: "solar",
      day: 12,
      birthMinute: 15,
      viewYear: 2026,
    });
    expect(submissions[1]).toMatchObject({
      id: "chart-user",
      submitterType: "user",
      userId: "user-1",
      userEmail: "user@example.com",
      userName: "Nguoi dung",
      fullName: "Nguyen Van A",
      calendarType: "lunar",
      birthHour: 3,
    });
  });
});
