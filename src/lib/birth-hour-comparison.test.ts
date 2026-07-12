import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { compareBirthHours } from "@/lib/birth-hour-comparison";

const baseInput = {
  gender: "male" as const,
  calendarType: "solar" as const,
  day: 12,
  month: 8,
  year: 1992,
  viewYear: 2026,
};

describe("compareBirthHours", () => {
  it("generates one candidate for each of the 12 birth-hour branches", () => {
    const result = compareBirthHours(baseInput);

    expect(result.candidates).toHaveLength(12);
    expect(result.candidates.map((candidate) => candidate.birthHour)).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]);
    expect(new Set(result.candidates.map((candidate) => candidate.hourBranch)).size).toBe(12);
  });

  it("separates fields that stay stable from fields that change by hour", () => {
    const result = compareBirthHours(baseInput);

    expect(result.stableFields.map((field) => field.key)).toEqual(expect.arrayContaining(["solarDate", "lunarDate", "canChiYear", "banMenh"]));
    expect(result.variableFields.map((field) => field.key)).toEqual(
      expect.arrayContaining(["menh", "than", "canChiHour", "boneWeight", "mainStarPlacements"]),
    );
  });

  it("is deterministic and does not expose generatedAt noise", () => {
    const first = compareBirthHours(baseInput);
    const second = compareBirthHours(baseInput);

    expect(second).toEqual(first);
    expect(JSON.stringify(first)).not.toContain("generatedAt");
  });

  it("rejects unsafe or impossible input before running comparisons", () => {
    expect(() => compareBirthHours({ ...baseInput, day: 31, month: 2 })).toThrow("INVALID_BIRTH_DATE");
    expect(() => compareBirthHours({ ...baseInput, year: 1899 })).toThrow("INVALID_BIRTH_YEAR");
    expect(() => compareBirthHours({ ...baseInput, gender: "other" as never })).toThrow("INVALID_GENDER");
  });

  it("stays pure and does not import persistence or server actions", () => {
    const source = readFileSync("src/lib/birth-hour-comparison.ts", "utf8");

    expect(source).not.toContain("@/lib/data");
    expect(source).not.toContain("@/app/actions");
    expect(source).not.toContain("saveChart");
    expect(source).not.toContain("createChartAction");
  });
});
