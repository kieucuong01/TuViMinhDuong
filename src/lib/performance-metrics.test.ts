import { describe, expect, it } from "vitest";
import {
  evaluateBudget,
  median,
  selectPrimaryBottleneck,
  summarize,
  type PerformanceSample,
  type PerformanceSummary,
} from "./performance-metrics";

function summary(overrides: Partial<PerformanceSummary> = {}): PerformanceSummary {
  return {
    route: "home",
    lcpMs: 2_000,
    cls: 0.05,
    ttfbMs: 400,
    htmlBytes: 75_000,
    initialJsBytes: 100_000,
    samples: 3,
    ...overrides,
  };
}

describe("performance metrics", () => {
  it("uses the middle sorted value as the median", () => {
    expect(median([9, 1, 5])).toBe(5);
    expect(median([10, 2, 8, 4])).toBe(6);
  });

  it("rejects an empty or non-finite median input", () => {
    expect(() => median([])).toThrow("at least one finite value");
    expect(() => median([1, Number.NaN])).toThrow("at least one finite value");
  });

  it("summarizes each route from three samples using medians", () => {
    const samples: PerformanceSample[] = [
      { route: "chart-result", lcpMs: 1_900, cls: 0.04, ttfbMs: 500, htmlBytes: 80_000, initialJsBytes: 110_000 },
      { route: "home", lcpMs: 1_800, cls: 0.03, ttfbMs: 300, htmlBytes: 70_000, initialJsBytes: 100_000 },
      { route: "chart-result", lcpMs: 2_200, cls: 0.06, ttfbMs: 700, htmlBytes: 90_000, initialJsBytes: 120_000 },
      { route: "home", lcpMs: 2_000, cls: 0.05, ttfbMs: 500, htmlBytes: 80_000, initialJsBytes: 120_000 },
      { route: "chart-result", lcpMs: 2_000, cls: 0.05, ttfbMs: 600, htmlBytes: 85_000, initialJsBytes: 115_000 },
      { route: "home", lcpMs: 1_900, cls: 0.04, ttfbMs: 400, htmlBytes: 75_000, initialJsBytes: 110_000 },
    ];

    expect(summarize(samples)).toEqual([
      { route: "home", lcpMs: 1_900, cls: 0.04, ttfbMs: 400, htmlBytes: 75_000, initialJsBytes: 110_000, samples: 3 },
      { route: "chart-result", lcpMs: 2_000, cls: 0.05, ttfbMs: 600, htmlBytes: 85_000, initialJsBytes: 115_000, samples: 3 },
    ]);
  });

  it("selects the largest normalized bottleneck and uses the documented tie order", () => {
    expect(selectPrimaryBottleneck(summary({ ttfbMs: 760 }))).toBe("ttfbMs");
    expect(selectPrimaryBottleneck(summary())).toBe("lcpMs");
  });

  it("rejects Core Web Vitals and initial JavaScript regressions", () => {
    const before = summary();

    expect(evaluateBudget(before, summary({ lcpMs: 2_501 }), "lcpMs").reasons).toContain("LCP 2501ms exceeds 2500ms");
    expect(evaluateBudget(before, summary({ cls: 0.1001 }), "lcpMs").reasons).toContain("CLS 0.1001 exceeds 0.1");
    expect(evaluateBudget(before, summary({ initialJsBytes: 100_001 }), "lcpMs").reasons).toContain(
      "Initial JavaScript increased from 100000 to 100001 bytes",
    );
  });

  it("requires a 15 percent bottleneck improvement when the baseline is already good", () => {
    const before = summary({ ttfbMs: 700 });
    const insufficient = evaluateBudget(before, summary({ ttfbMs: 600 }), "ttfbMs");
    const sufficient = evaluateBudget(before, summary({ ttfbMs: 595 }), "ttfbMs");

    expect(insufficient.passed).toBe(false);
    expect(insufficient.improvementPct).toBe(14.3);
    expect(insufficient.reasons).toContain("ttfbMs improved 14.3%, below required 15%");
    expect(sufficient).toMatchObject({ passed: true, improvementPct: 15 });
  });
});
