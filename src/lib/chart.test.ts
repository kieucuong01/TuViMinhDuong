import { describe, expect, it } from "vitest";
import { generateTuViChart, getHourBranchIndex } from "@/lib/chart";
import { lunarToSolar, solarToLunar } from "@/lib/lunar";

describe("Vietnamese lunar calendar", () => {
  it("converts Tet dates with the Vietnamese UTC+7 lunar calendar", () => {
    expect(solarToLunar(10, 2, 2024)).toEqual({ day: 1, month: 1, year: 2024, leap: false });
    expect(solarToLunar(17, 2, 2026)).toEqual({ day: 1, month: 1, year: 2026, leap: false });
  });

  it("converts lunar dates back to solar dates", () => {
    expect(lunarToSolar(1, 1, 2024)).toEqual({ day: 10, month: 2, year: 2024 });
    expect(lunarToSolar(1, 1, 2026)).toEqual({ day: 17, month: 2, year: 2026 });
  });
});

describe("tu vi chart engine", () => {
  it("maps Vietnamese double-hour ranges with Ty starting at 23:00", () => {
    expect(getHourBranchIndex(23)).toBe(0);
    expect(getHourBranchIndex(0)).toBe(0);
    expect(getHourBranchIndex(1)).toBe(1);
    expect(getHourBranchIndex(22)).toBe(11);
  });

  it("generates a stable 12-palace chart payload", () => {
    const chart = generateTuViChart({
      fullName: "Nguyễn Minh Anh",
      gender: "male",
      calendarType: "solar",
      day: 19,
      month: 5,
      year: 1990,
      birthHour: 8,
      viewYear: 2026,
      timezone: "Asia/Bangkok",
    });

    expect(chart.input.fullName).toBe("Nguyễn Minh Anh");
    expect(chart.solar).toEqual({ day: 19, month: 5, year: 1990 });
    expect(chart.palaces).toHaveLength(12);
    expect(chart.palaces.filter((palace) => palace.isMenh)).toHaveLength(1);
    expect(chart.menh).toBeTruthy();
    expect(chart.than).toBeTruthy();
    expect(chart.cuc).toContain("cục");
    expect(chart.canChi.year).toBe("Canh Ngọ");
    expect(chart.engine.version).toBe("0.2.0");
  });
});
