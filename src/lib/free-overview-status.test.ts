import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { generateTuViChart, type TuViChart } from "@/lib/chart";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

function chartFixture(): TuViChart {
  return generateTuViChart({
    fullName: "Kiều Tấn Cường",
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

describe("free overview status", () => {
  it("contains no free LLM generation, preview, router, or repair job", () => {
    const source = readFileSync(fileURLToPath(new URL("./data.ts", import.meta.url)), "utf8");

    expect(source).not.toContain("generateFreeOverview(record.chart)");
    expect(source).not.toContain("generateFreeOverviewPreview");
    expect(source).not.toContain("fullOverviewPromise");
  });

  it("returns a ready 1,400-1,650 visible-word v12 seed overview immediately", async () => {
    const { FREE_OVERVIEW_MAX_WORDS, FREE_OVERVIEW_MIN_WORDS, FREE_OVERVIEW_VERSION } = await import("@/lib/ai");
    const { getFreeOverviewStatus } = await import("@/lib/data");
    const status = getFreeOverviewStatus(chartFixture());

    expect(status.status).toBe("ready");
    expect(status.source).toBe("seed-rules");
    expect(status.model).toBe("interpretation-rules-v2");
    expect(FREE_OVERVIEW_VERSION).toBe("free-seed-overview-v12");
    expect(status.jobStatus).toBe("completed");
    expect(status.content).toContain("# Bản tổng quan lá số của bạn");
    expect(status.content).toContain("## 4. Vận hiện tại");
    expect(status.wordCount).toBeGreaterThanOrEqual(FREE_OVERVIEW_MIN_WORDS);
    expect(status.wordCount).toBeLessThanOrEqual(FREE_OVERVIEW_MAX_WORDS);
  });

  it("does not serve legacy provider-generated free content", async () => {
    const { getFreeOverviewStatus } = await import("@/lib/data");
    const chart = {
      ...chartFixture(),
      freeOverview: {
        content: "LEGACY_DEEPSEEK_FREE_CONTENT",
        model: "deepseek/deepseek-chat",
        generatedAt: "2026-06-02T00:00:00.000Z",
        version: "free-mini-report-v9",
      },
    } as TuViChart;

    const status = getFreeOverviewStatus(chart);

    expect(status.status).toBe("ready");
    expect(status.content).not.toContain("LEGACY_DEEPSEEK_FREE_CONTENT");
    expect(status.source).toBe("seed-rules");
  });
});
