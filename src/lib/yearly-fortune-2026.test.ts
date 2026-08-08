import { describe, expect, it } from "vitest";
import { generateTuViChart } from "@/lib/chart";
import { CHART_FIXTURES } from "@/lib/chart.fixtures";
import { buildYearlyFortune2026Report } from "@/lib/yearly-fortune-2026";

function fixtureChart(index: number) {
  return generateTuViChart({ ...CHART_FIXTURES[index].input, viewYear: 2026 });
}

describe("yearly fortune 2026 report", () => {
  it("builds a complete evidence-backed report for the Bính Ngọ year", () => {
    const report = buildYearlyFortune2026Report(fixtureChart(0));

    expect(report.year).toBe(2026);
    expect(report.yearLabel).toBe("Bính Ngọ");
    expect(report.lunarAge).toBe(32);
    expect(report.opening.length).toBeGreaterThan(220);
    expect(report.areas.map((area) => area.key)).toEqual([
      "career",
      "money",
      "love",
      "health",
      "relations",
    ]);
    expect(report.areas.every((area) => area.evidence.length > 0)).toBe(true);
    expect(report.areas.every((area) => area.body.length > 220)).toBe(true);
    expect(report.seasons.map((season) => season.months)).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      [10, 11, 12],
    ]);
    expect(report.actionPlan).toHaveLength(3);
    expect(report.overallScore).toBeGreaterThanOrEqual(35);
    expect(report.overallScore).toBeLessThanOrEqual(92);
  });

  it("changes the personal reading when gender and birth hour change the chart", () => {
    const first = buildYearlyFortune2026Report(fixtureChart(0));
    const secondFixture = CHART_FIXTURES.find((fixture) => (
      fixture.input.gender !== CHART_FIXTURES[0].input.gender
      && fixture.input.birthHour !== CHART_FIXTURES[0].input.birthHour
    ));
    expect(secondFixture).toBeTruthy();
    const second = buildYearlyFortune2026Report(generateTuViChart({ ...secondFixture!.input, viewYear: 2026 }));

    expect(first.opening).not.toBe(second.opening);
    expect(first.overallScore).not.toBe(second.overallScore);
    expect(first.areas.map((area) => area.body)).not.toEqual(second.areas.map((area) => area.body));
  });

  it("keeps every score bounded and reports missing palace data honestly", () => {
    const chart = fixtureChart(0);
    const withoutCareerPalace = {
      ...chart,
      palaces: chart.palaces.filter((palace) => palace.name !== "Quan Lộc"),
    };
    const report = buildYearlyFortune2026Report(withoutCareerPalace);
    const career = report.areas.find((area) => area.key === "career");

    expect(report.areas.every((area) => area.score >= 35 && area.score <= 92)).toBe(true);
    expect(career?.evidence.some((item) => item.available === false)).toBe(true);
    expect(career?.evidence.some((item) => item.summary.includes("Chưa đủ dữ liệu"))).toBe(true);
  });
});
