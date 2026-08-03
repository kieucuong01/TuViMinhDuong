import { describe, expect, it } from "vitest";
import { generateTuViChart, type StarBrightness, type TuViChart } from "@/lib/chart";
import { CHART_FIXTURES } from "@/lib/chart.fixtures";
import { buildWealthFortuneReport } from "@/lib/wealth-fortune";

const FIXTURE_INPUT = CHART_FIXTURES[0].input;

function withPalaceProfile(
  chart: TuViChart,
  palaceName: string,
  state: StarBrightness,
  supportStars: string[] = [],
) {
  return {
    ...chart,
    palaces: chart.palaces.map((palace) => palace.name === palaceName ? {
      ...palace,
      starStates: Object.fromEntries(palace.mainStars.map((star) => [star, state])),
      supportStars,
    } : palace),
  };
}

function withEveryPalaceState(chart: TuViChart, state: StarBrightness) {
  return {
    ...chart,
    palaces: chart.palaces.map((palace) => ({
      ...palace,
      starStates: Object.fromEntries(palace.mainStars.map((star) => [star, state])),
      supportStars: [],
    })),
  };
}

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

  it("returns one approved posture label for the composite score", () => {
    const chart = generateTuViChart(FIXTURE_INPUT);
    const report = buildWealthFortuneReport(chart);

    expect([
      "Tăng trưởng từ nghề",
      "Quản trị dòng tiền",
      "Mở rộng có kiểm chứng",
      "Tích lũy bền",
      "Phòng thủ và sửa nền",
    ]).toContain(report.postureLabel);
  });

  it("builds each pillar from all palaces required by the design", () => {
    const chart = generateTuViChart(FIXTURE_INPUT);
    const score = (candidate: TuViChart, key: string) => buildWealthFortuneReport(candidate).pillars.find((pillar) => pillar.key === key)?.score;

    expect(score(withPalaceProfile(chart, "Phúc Đức", "M"), "cashflow"))
      .toBeGreaterThan(score(withPalaceProfile(chart, "Phúc Đức", "H"), "cashflow") || 0);
    expect(score(withPalaceProfile(chart, "Mệnh", "M"), "career"))
      .toBeGreaterThan(score(withPalaceProfile(chart, "Mệnh", "H"), "career") || 0);
    expect(score(withPalaceProfile(chart, "Nô Bộc", "M"), "mobility"))
      .toBeGreaterThan(score(withPalaceProfile(chart, "Nô Bộc", "H"), "mobility") || 0);
    expect(score(withPalaceProfile(chart, "Điền Trạch", "M"), "foundation"))
      .toBeGreaterThan(score(withPalaceProfile(chart, "Điền Trạch", "H"), "foundation") || 0);
  });

  it("includes base support and caution stars in pillar scores", () => {
    const chart = generateTuViChart(FIXTURE_INPUT);
    const supported = withPalaceProfile(chart, "Tài Bạch", "B", ["Hóa Lộc", "Văn Xương"]);
    const cautioned = withPalaceProfile(chart, "Tài Bạch", "B", ["Kình Dương", "Địa Kiếp"]);
    const cashflow = (candidate: TuViChart) => buildWealthFortuneReport(candidate).pillars.find((pillar) => pillar.key === "cashflow")?.score || 0;

    expect(cashflow(supported)).toBeGreaterThan(cashflow(cautioned));
  });

  it("uses neutral fallback evidence instead of throwing when a palace is missing", () => {
    const chart = generateTuViChart(FIXTURE_INPUT);
    const chartWithoutTaiBach = { ...chart, palaces: chart.palaces.filter((palace) => palace.name !== "Tài Bạch") };

    const report = buildWealthFortuneReport(chartWithoutTaiBach);
    const evidence = report.palaceEvidence.find((item) => item.palace === "Tài Bạch");

    expect(evidence).toMatchObject({ branch: "Chưa có dữ liệu", mainStars: ["Chưa có dữ liệu"] });
    expect(report.pillars.every((pillar) => pillar.score >= 35 && pillar.score <= 92)).toBe(true);
  });

  it("uses the conservative threshold and stable pillar-order tie break for posture", () => {
    const chart = generateTuViChart(FIXTURE_INPUT);
    const defensive = buildWealthFortuneReport(withEveryPalaceState(chart, "H"));
    const tied = buildWealthFortuneReport(withEveryPalaceState(chart, "B"));

    expect(defensive.overallScore).toBeLessThan(55);
    expect(defensive.postureLabel).toBe("Phòng thủ và sửa nền");
    expect(new Set(tied.pillars.map((pillar) => pillar.score))).toHaveLength(1);
    expect(tied.postureLabel).toBe("Quản trị dòng tiền");
  });
});
