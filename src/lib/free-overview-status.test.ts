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
  it("keeps the page status synchronous and delegates LLM work to the process path", () => {
    const source = readFileSync(fileURLToPath(new URL("./data.ts", import.meta.url)), "utf8");

    expect(source).toContain("generateFreeOverview(record.chart)");
    expect(source).not.toContain("generateFreeOverviewPreview");
    expect(source).not.toContain("fullOverviewPromise");
  });

  it("returns a fast 520-950 visible-word block preview while the LLM overview is missing", async () => {
    const { FREE_OVERVIEW_MAX_WORDS, FREE_OVERVIEW_MIN_WORDS, FREE_OVERVIEW_VERSION } = await import("@/lib/ai");
    const { getFreeOverviewStatus } = await import("@/lib/data");
    const status = getFreeOverviewStatus(chartFixture());

    expect(status.status).toBe("fallback");
    expect(status.source).toBe("seed-rules");
    expect(FREE_OVERVIEW_VERSION).toBe("free-block-preview-v2");
    expect(status.jobStatus).toBe("idle");
    expect(status.content).toContain("# Luận giải miễn phí dành cho");
    expect(status.content).toContain("## 4. Vận hạn năm");
    expect(status.content.match(/🔒 Nâng cấp Premium để xem:/gu)).toHaveLength(4);
    expect(status.wordCount).toBeGreaterThanOrEqual(FREE_OVERVIEW_MIN_WORDS);
    expect(status.wordCount).toBeLessThanOrEqual(FREE_OVERVIEW_MAX_WORDS);
  }, 30000);

  it("serves a cached current-version LLM overview when available", async () => {
    const { FREE_OVERVIEW_VERSION, buildInstantFreeOverview } = await import("@/lib/ai");
    const { getFreeOverviewStatus } = await import("@/lib/data");
    const content = buildInstantFreeOverview(chartFixture());
    const chart = {
      ...chartFixture(),
      freeOverview: {
        content,
        model: "deepseek/deepseek-v4-flash",
        generatedAt: "2026-07-20T00:00:00.000Z",
        version: FREE_OVERVIEW_VERSION,
        jobStatus: "completed",
      },
    } as TuViChart;

    const status = getFreeOverviewStatus(chart);

    expect(status.status).toBe("ready");
    expect(status.source).toBe("llm");
    expect(status.model).toBe("deepseek/deepseek-v4-flash");
    expect(status.content).toBe(content);
    expect(status.jobStatus).toBe("completed");
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

    expect(status.status).toBe("fallback");
    expect(status.content).not.toContain("LEGACY_DEEPSEEK_FREE_CONTENT");
    expect(status.source).toBe("seed-rules");
  });
});
