import { describe, expect, it, vi } from "vitest";
import { generateTuViChart, type TuViChart } from "@/lib/chart";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

function chartFixture(): TuViChart {
  return generateTuViChart({
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
  });
}

function completeOverviewContent() {
  const filler = Array.from({ length: 80 }, () => "dữ-liệu").join(" ");
  return `## Chân dung nổi bật
Cung Mệnh có Tử Vi. ${filler}

## Điểm mạnh nên phát huy
${filler}

## Cơ hội công việc và tài chính
${filler}

## Điều cần thận trọng
${filler}

## Gợi ý hành động trong năm 2026
${filler}`;
}

describe("free overview status", () => {
  it("returns instant fallback when the AI overview is not cached yet", async () => {
    const { countWords, FREE_OVERVIEW_MIN_WORDS, FREE_OVERVIEW_MAX_WORDS } = await import("@/lib/ai");
    const { getFreeOverviewStatus } = await import("@/lib/data");
    const status = getFreeOverviewStatus(chartFixture());

    expect(status.status).toBe("fallback");
    expect(status.source).toBe("instant-template");
    expect(status.content).toContain("## Chân dung nổi bật");
    expect(countWords(status.content)).toBeGreaterThanOrEqual(FREE_OVERVIEW_MIN_WORDS);
    expect(countWords(status.content)).toBeLessThanOrEqual(FREE_OVERVIEW_MAX_WORDS);
  });

  it("treats complete matching-version AI content as ready", async () => {
    const { FREE_OVERVIEW_VERSION } = await import("@/lib/ai");
    const { getFreeOverviewStatus } = await import("@/lib/data");
    const chart = {
      ...chartFixture(),
      freeOverview: {
        content: completeOverviewContent(),
        model: "test-model",
        generatedAt: "2026-06-02T00:00:00.000Z",
        version: FREE_OVERVIEW_VERSION,
      },
    } as TuViChart;

    const status = getFreeOverviewStatus(chart);

    expect(status.status).toBe("ready");
    expect(status.source).toBe("ai-cache");
    expect(status.model).toBe("test-model");
  });

  it("marks current pending overview jobs as processing", async () => {
    const { FREE_OVERVIEW_VERSION } = await import("@/lib/ai");
    const { getFreeOverviewStatus } = await import("@/lib/data");
    const chart = {
      ...chartFixture(),
      freeOverviewJob: {
        status: "PENDING",
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: FREE_OVERVIEW_VERSION,
      },
    } as TuViChart;

    const status = getFreeOverviewStatus(chart);

    expect(status.status).toBe("fallback");
    expect(status.jobStatus).toBe("processing");
  });

  it("marks old pending overview jobs as stale so they can be retried", async () => {
    const { FREE_OVERVIEW_VERSION } = await import("@/lib/ai");
    const { getFreeOverviewStatus } = await import("@/lib/data");
    const chart = {
      ...chartFixture(),
      freeOverviewJob: {
        status: "PENDING",
        startedAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        version: FREE_OVERVIEW_VERSION,
      },
    } as TuViChart;

    const status = getFreeOverviewStatus(chart);

    expect(status.status).toBe("fallback");
    expect(status.jobStatus).toBe("stale");
  });

  it("keeps failed overview errors visible while serving the instant fallback", async () => {
    const { FREE_OVERVIEW_VERSION } = await import("@/lib/ai");
    const { getFreeOverviewStatus } = await import("@/lib/data");
    const chart = {
      ...chartFixture(),
      freeOverviewJob: {
        status: "FAILED",
        startedAt: "2026-06-02T00:00:00.000Z",
        updatedAt: "2026-06-02T00:01:00.000Z",
        version: FREE_OVERVIEW_VERSION,
        error: "LLM timed out",
      },
    } as TuViChart;

    const status = getFreeOverviewStatus(chart);

    expect(status.status).toBe("fallback");
    expect(status.jobStatus).toBe("failed");
    expect(status.error).toBe("LLM timed out");
  });
});
