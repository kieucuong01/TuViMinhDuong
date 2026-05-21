import { describe, expect, it } from "vitest";
import { CHART_FIXTURES } from "@/lib/chart.fixtures";
import { generateTuViChart, type Palace } from "@/lib/chart";

function findPalace(palaces: Palace[], name: string) {
  const palace = palaces.find((item) => item.name === name);
  if (!palace) throw new Error(`Missing palace fixture target: ${name}`);
  return palace;
}

describe("tu vi chart reference fixtures", () => {
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
