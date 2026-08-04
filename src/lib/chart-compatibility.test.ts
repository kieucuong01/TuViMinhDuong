import { describe, expect, it } from "vitest";
import { CHART_FIXTURES } from "@/lib/chart.fixtures";
import { buildChartCompatibilityReport } from "@/lib/chart-compatibility";

const first = { ...CHART_FIXTURES[0].input, fullName: "Minh" };
const second = { ...CHART_FIXTURES[1].input, fullName: "An" };

describe("two-chart compatibility report", () => {
  it("builds six practical reading themes from two real chart inputs", () => {
    const report = buildChartCompatibilityReport(first, second);

    expect(report.people.map((person) => person.name)).toEqual(["Minh", "An"]);
    expect(report.themes.map((theme) => theme.key)).toEqual([
      "temperament",
      "communication",
      "commitment",
      "finance",
      "work",
      "family",
    ]);
    expect(report.themes.every((theme) => theme.summary.length > 120)).toBe(true);
    expect(report.themes.every((theme) => theme.possibleExpression.length > 100)).toBe(true);
    expect(report.themes.every((theme) => theme.actions.length >= 2)).toBe(true);
    expect(report.themes.every((theme) => theme.questions.length >= 2)).toBe(true);
  });

  it("keeps the assessment symmetric when the two people are swapped", () => {
    const forward = buildChartCompatibilityReport(first, second);
    const reversed = buildChartCompatibilityReport(second, first);

    expect(reversed.overview.level).toBe(forward.overview.level);
    expect(reversed.themes.map((theme) => [theme.key, theme.level])).toEqual(
      forward.themes.map((theme) => [theme.key, theme.level]),
    );
  });

  it("shows chart evidence for both people instead of generic compatibility copy", () => {
    const report = buildChartCompatibilityReport(first, second);

    for (const theme of report.themes) {
      expect(theme.evidence).toHaveLength(2);
      expect(theme.evidence.map((item) => item.personName)).toEqual(["Minh", "An"]);
      expect(theme.evidence.every((item) => item.details.some((detail) => detail.includes("cung")))).toBe(true);
      expect(theme.evidence.every((item) => item.details.some((detail) => /chính tinh|Vô chính diệu/.test(detail)))).toBe(true);
    }
  });

  it("does not repeat the former summary skeleton across six layers", () => {
    const report = buildChartCompatibilityReport(first, second);
    const openings = report.themes.map((theme) => theme.summary.split(/[.!?]/, 1)[0].trim());

    expect(report.themes.filter((theme) => theme.summary.includes("nổi bật ở xu hướng"))).toHaveLength(0);
    expect(new Set(openings).size).toBe(6);
  });

  it("changes the narrative when chart data changes even if the display names stay the same", () => {
    const firstPair = buildChartCompatibilityReport(first, second);
    const differentSecond = { ...CHART_FIXTURES[2].input, fullName: "An" };
    const secondPair = buildChartCompatibilityReport(first, differentSecond);

    expect(secondPair.themes.map((theme) => theme.summary)).not.toEqual(
      firstPair.themes.map((theme) => theme.summary),
    );
  });

  it("uses guidance bands and explicit interpretation limits instead of a fate verdict", () => {
    const report = buildChartCompatibilityReport(first, second);
    const serialized = JSON.stringify(report);

    expect(["flow", "coordinate", "discuss"]).toContain(report.overview.level);
    expect(report.disclaimer).toContain("không quyết định");
    expect(report.disclaimer).toContain("giờ sinh");
    expect(serialized).not.toMatch(/chắc chắn|định mệnh|phải cưới|phải chia tay|điểm số định đoạt/i);
  });

  it("rejects impossible birth dates before generating charts", () => {
    expect(() =>
      buildChartCompatibilityReport(
        { ...first, day: 31, month: 2 },
        second,
      ),
    ).toThrow("INVALID_BIRTH_DATE");
  });
});
