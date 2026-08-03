import { describe, expect, it } from "vitest";
import { generateTuViChart } from "@/lib/chart";
import { CHART_FIXTURES } from "@/lib/chart.fixtures";
import { buildWealthFortuneReport } from "@/lib/wealth-fortune";

const FIXTURE_INPUT = CHART_FIXTURES[0].input;

describe("wealth fortune report", () => {
  it("builds four bounded directional pillars", () => {
    const chart = generateTuViChart(FIXTURE_INPUT);
    const report = buildWealthFortuneReport(chart);

    expect(report.pillars.map((item) => item.key)).toEqual([
      "cashflow",
      "career",
      "mobility",
      "foundation",
    ]);
    expect(report.overallScore).toBeGreaterThanOrEqual(35);
    expect(report.overallScore).toBeLessThanOrEqual(92);
    expect(report.pillars.every((item) => item.score >= 35 && item.score <= 92)).toBe(true);
  });

  it("builds a varied five-year directional trend", () => {
    const chart = generateTuViChart(FIXTURE_INPUT);
    const report = buildWealthFortuneReport(chart);

    expect(report.fiveYearTrend).toHaveLength(5);
    expect(report.fiveYearTrend.map((point) => point.year)).toEqual([2026, 2027, 2028, 2029, 2030]);
    expect(new Set(report.fiveYearTrend.map((point) => point.score)).size).toBeGreaterThan(1);
    expect(report.strongestYear.score).toBe(Math.max(...report.fiveYearTrend.map((point) => point.score)));
    expect(report.cautionYear.score).toBe(Math.min(...report.fiveYearTrend.map((point) => point.score)));
  });

  it("exposes Tài - Quan - Di evidence and responsible next steps", () => {
    const chart = generateTuViChart(FIXTURE_INPUT);
    const report = buildWealthFortuneReport(chart);

    expect(report.palaceEvidence.map((item) => item.palace)).toEqual(["Tài Bạch", "Quan Lộc", "Thiên Di"]);
    expect(report.palaceEvidence.every((item) => item.mainStars.length > 0)).toBe(true);
    expect(report.palaceEvidence.every((item) => item.mainStars.every((star) => / \([MVĐBH]\)$/.test(star)))).toBe(true);
    expect(report.palaceEvidence.every((item) => Array.isArray(item.supportStars) && Array.isArray(item.cautionStars))).toBe(true);
    expect(report.actionPlan.map((step) => step.title)).toEqual([
      "Sửa trụ yếu",
      "Dùng trụ mạnh",
      "Đặt cổng kiểm chứng",
    ]);
    expect(JSON.stringify(report)).not.toMatch(/chắc chắn|cam kết|phát tài|mua ngay|bán ngay/i);
    expect(report.disclaimer).toContain("không thay thế tư vấn tài chính");
  });
});
