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
    palaces: chart.palaces.map((palace) => (palaceName === "Thân" ? palace.isThan : palace.name === palaceName) ? {
      ...palace,
      starStates: Object.fromEntries(palace.mainStars.map((star) => [star, state])),
      supportStars,
    } : palace),
  };
}

function withoutPalaceSignals(chart: TuViChart) {
  return {
    ...chart,
    palaces: chart.palaces.map((palace) => ({
      ...palace,
      starStates: {},
      supportStars: [],
    })),
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
    expect(report.palaceEvidence.every((item) => Array.isArray(item.supportStars) && Array.isArray(item.cautionStars))).toBe(true);
    expect(report.actionPlan.map((step) => step.title)).toEqual([
      "30 ngày — Sửa trụ yếu",
      "60 ngày — Dùng trụ mạnh",
      "90 ngày — Đặt cổng kiểm chứng",
    ]);
    expect(JSON.stringify(report)).not.toMatch(/chắc chắn|cam kết|phát tài|mua ngay|bán ngay/i);
    expect(report.disclaimer).toContain("không thay thế tư vấn tài chính");
  });

  it.each([
    ["cashflow", "Tài Bạch"],
    ["cashflow", "Phúc Đức"],
    ["cashflow", "Điền Trạch"],
    ["career", "Quan Lộc"],
    ["career", "Mệnh"],
    ["career", "Thân"],
    ["mobility", "Thiên Di"],
    ["mobility", "Quan Lộc"],
    ["mobility", "Nô Bộc"],
    ["foundation", "Phúc Đức"],
    ["foundation", "Điền Trạch"],
    ["foundation", "Tài Bạch"],
  ] as const)("uses %s source %s in its composite", (pillarKey, palaceName) => {
    const chart = generateTuViChart(FIXTURE_INPUT);
    const score = (candidate: TuViChart, key: string) => buildWealthFortuneReport(candidate).pillars.find((pillar) => pillar.key === key)?.score;

    expect(score(withPalaceProfile(chart, palaceName, "M"), pillarKey))
      .toBeGreaterThan(score(withPalaceProfile(chart, palaceName, "H"), pillarKey) || 0);
  });

  it("contributes an exact neutral 60 when a composite source palace is missing", () => {
    const neutralChart = withoutPalaceSignals(generateTuViChart(FIXTURE_INPUT));
    const taiBachCautioned = withPalaceProfile(neutralChart, "Tài Bạch", "H");
    const missingSecondarySources = {
      ...taiBachCautioned,
      palaces: taiBachCautioned.palaces.filter((palace) => !["Phúc Đức", "Điền Trạch"].includes(palace.name)),
    };

    const cashflow = buildWealthFortuneReport(missingSecondarySources).pillars.find((pillar) => pillar.key === "cashflow");

    expect(cashflow?.score).toBe(56);
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

    expect(evidence).toMatchObject({ available: false, branch: "Chưa có dữ liệu", mainStars: ["Chưa có dữ liệu"] });
    expect(report.pillars.every((pillar) => pillar.score >= 35 && pillar.score <= 92)).toBe(true);
  });

  it("preserves an absent main-star brightness instead of fabricating Bình", () => {
    const chart = generateTuViChart(FIXTURE_INPUT);
    const chartWithAbsentBrightness = {
      ...chart,
      palaces: chart.palaces.map((palace) => palace.name === "Tài Bạch" ? {
        ...palace,
        mainStars: ["Vô chính diệu"],
        starStates: {},
      } : palace),
    };

    const evidence = buildWealthFortuneReport(chartWithAbsentBrightness).palaceEvidence.find((item) => item.palace === "Tài Bạch");

    expect(evidence).toMatchObject({ available: true, mainStars: ["Vô chính diệu"] });
  });

  it.each([
    ["Phòng thủ và sửa nền", ["all-cautioned"]],
    ["Quản trị dòng tiền", ["Tài Bạch"]],
    ["Tăng trưởng từ nghề", ["Quan Lộc"]],
    ["Mở rộng có kiểm chứng", ["Thiên Di"]],
    ["Tích lũy bền", ["Phúc Đức", "Điền Trạch"]],
  ] as const)("returns posture label %s for its defining profile", (expectedLabel, dominantPalaces) => {
    const chart = generateTuViChart(FIXTURE_INPUT);
    const baseline = dominantPalaces[0] === "all-cautioned"
      ? withEveryPalaceState(chart, "H")
      : dominantPalaces.reduce((candidate, palaceName) => withPalaceProfile(candidate, palaceName, "M"), withEveryPalaceState(chart, "B"));
    const report = buildWealthFortuneReport(baseline);

    expect(report.postureLabel).toBe(expectedLabel);
  });
});
