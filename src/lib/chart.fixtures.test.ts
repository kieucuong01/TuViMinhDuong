import { describe, expect, it } from "vitest";
import { CHART_FIXTURES, chartFixtureExternalValidationGaps } from "@/lib/chart.fixtures";
import { generateTuViChart, type Palace } from "@/lib/chart";

function findPalace(palaces: Palace[], name: string) {
  const palace = palaces.find((item) => item.name === name);
  if (!palace) throw new Error(`Missing palace fixture target: ${name}`);
  return palace;
}

describe("tu vi chart reference fixtures", () => {
  it("declares the golden-fixture coverage needed to guard the chart engine", () => {
    const coveredHours = new Set(CHART_FIXTURES.map((fixture) => fixture.coverage?.hourBranch));
    const coveredGenders = new Set(CHART_FIXTURES.map((fixture) => fixture.coverage?.gender));
    const coveredStates = new Set(CHART_FIXTURES.flatMap((fixture) => fixture.coverage?.starStates || []));
    const knownProvenance = new Set(["pdf", "reference-image", "web-cross-check", "engine-regression"]);

    expect([...coveredHours]).toEqual(expect.arrayContaining(["Tý", "Dần", "Ngọ", "Hợi"]));
    expect([...coveredGenders]).toEqual(expect.arrayContaining(["male", "female"]));
    expect(CHART_FIXTURES.some((fixture) => fixture.coverage?.hasTuan)).toBe(true);
    expect(CHART_FIXTURES.some((fixture) => fixture.coverage?.hasTriet)).toBe(true);
    expect([...coveredStates]).toEqual(expect.arrayContaining(["M", "V", "Đ", "B", "H"]));

    for (const fixture of CHART_FIXTURES) {
      expect(fixture.source.trim().length).toBeGreaterThan(20);
      expect(knownProvenance.has(fixture.provenance)).toBe(true);
      expect(fixture.expected.canChi.hour.endsWith(fixture.coverage.hourBranch)).toBe(true);
      expect(fixture.input.gender).toBe(fixture.coverage.gender);
    }
  });

  it("does not overstate external PDF/web validation coverage", () => {
    expect(chartFixtureExternalValidationGaps()).toEqual([]);
  });

  for (const fixture of CHART_FIXTURES) {
    it(`matches ${fixture.id}`, () => {
      const chart = generateTuViChart(fixture.input);

      expect(chart.solar).toEqual(fixture.expected.solar);
      expect(chart.lunar).toEqual(fixture.expected.lunar);
      expect(chart.canChi).toEqual(fixture.expected.canChi);
      expect(chart.menh).toBe(fixture.expected.menh);
      expect(chart.than).toBe(fixture.expected.than);
      expect(chart.cuc).toBe(fixture.expected.cuc);
      expect(chart.banMenh).toBe(fixture.expected.banMenh);
      expect(chart.menhChu).toBe(fixture.expected.menhChu);
      expect(chart.thanChu).toBe(fixture.expected.thanChu);
      if (fixture.expected.laiNhan) {
        expect(chart.laiNhan).toBe(fixture.expected.laiNhan);
      }
      expect(chart.menhCucRelation).toBe(fixture.expected.menhCucRelation);
      expect(chart.daiVan[0]).toEqual(fixture.expected.firstDaiVan);
      if (fixture.expected.boneWeightLabel) {
        expect(chart.boneWeight.label).toBe(fixture.expected.boneWeightLabel);
      }

      for (const [palaceName, expectedStars] of Object.entries(fixture.expected.mainStarsByPalace)) {
        expect(findPalace(chart.palaces, palaceName).mainStars).toEqual(expectedStars);
      }

      for (const [palaceName, expectedStars] of Object.entries(fixture.expected.supportStarsInclude || {})) {
        const supportStars = findPalace(chart.palaces, palaceName).supportStars;
        for (const star of expectedStars) {
          expect(supportStars).toContain(star);
        }
      }

      for (const [palaceName, expectedStars] of Object.entries(fixture.expected.yearlyStarsInclude || {})) {
        const yearlyStars = findPalace(chart.palaces, palaceName).yearlyStars;
        for (const star of expectedStars) {
          expect(yearlyStars).toContain(star);
        }
      }

      for (const [palaceName, expectedStates] of Object.entries(fixture.expected.starStatesInclude || {})) {
        const palace = findPalace(chart.palaces, palaceName);
        for (const [star, state] of Object.entries(expectedStates)) {
          expect(palace.starStates[star]).toBe(state);
        }
      }
    });
  }
});
