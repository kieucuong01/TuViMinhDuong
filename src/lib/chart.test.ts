import { describe, expect, it } from "vitest";
import { CHART_ENGINE_VERSION, generateTuViChart, getHourBranchIndex } from "@/lib/chart";
import { lunarToSolar, solarToLunar } from "@/lib/lunar";

const MAIN_STARS = [
  "Tử Vi",
  "Liêm Trinh",
  "Thiên Đồng",
  "Vũ Khúc",
  "Thái Dương",
  "Thiên Cơ",
  "Thiên Phủ",
  "Thái Âm",
  "Tham Lang",
  "Cự Môn",
  "Thiên Tướng",
  "Thiên Lương",
  "Thất Sát",
  "Phá Quân",
];

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
    expect(chart.banMenh).toBeTruthy();
    expect(chart.menhChu).toBeTruthy();
    expect(chart.thanChu).toBeTruthy();
    expect(chart.menhCucRelation).toMatch(/Mệnh|Cục/);
    expect(chart.canChi.year).toBe("Canh Ngọ");
    expect(chart.engine.version).toBe(CHART_ENGINE_VERSION);
    expect(chart.boneWeight.label).toMatch(/lượng \d chỉ/);
  });

  it("places the 14 main stars exactly once", () => {
    const chart = generateTuViChart({
      fullName: "Hứa Thị Thúy Hằng",
      gender: "female",
      calendarType: "solar",
      day: 3,
      month: 4,
      year: 1995,
      birthHour: 1,
      viewYear: 2026,
      timezone: "Asia/Bangkok",
    });
    const stars = chart.palaces.flatMap((palace) => palace.mainStars).filter((star) => star !== "Vô chính diệu");

    expect(stars).toHaveLength(14);
    for (const star of MAIN_STARS) {
      expect(stars.filter((item) => item === star)).toHaveLength(1);
    }
    expect(chart.palaces.some((palace) => palace.supportStars.includes("Tuần"))).toBe(true);
    expect(chart.palaces.some((palace) => palace.supportStars.includes("Triệt"))).toBe(true);
    expect(chart.palaces.some((palace) => palace.yearlyStars.includes("L.Kình Dương"))).toBe(true);
    expect(chart.palaces.some((palace) => palace.yearlyStars.includes("L.Tang Môn"))).toBe(true);
    expect(chart.palaces.some((palace) => palace.yearlyStars.includes("L.Bạch Hổ"))).toBe(true);
    const yearlyStars = chart.palaces.flatMap((palace) => palace.yearlyStars);
    expect(yearlyStars).not.toContain("L.Phúc Đức");
    expect(yearlyStars).not.toContain("L.Thiên Đức");
    expect(yearlyStars).not.toContain("L.Điếu Khách");
    expect(yearlyStars.some((star) => star.startsWith("L.Hóa"))).toBe(false);
    expect(yearlyStars.some((star) => star.startsWith("L.") && /\([MVĐBH]\)$/.test(star))).toBe(false);
  });

  it("starts major-decade ranges from the Menh palace in both directions", () => {
    const chart = generateTuViChart({
      fullName: "Kiều Tấn Cường",
      gender: "male",
      calendarType: "solar",
      day: 3,
      month: 4,
      year: 1994,
      birthHour: 1,
      viewYear: 2026,
      timezone: "Asia/Bangkok",
    });

    expect(chart.daiVan[0].palace).toBe("Mệnh");
    expect(chart.palaces.find((palace) => palace.isMenh)?.ageRange).toBe(chart.daiVan[0].range);
  });

  it("computes can luong cot from lunar year, month, day and birth hour", () => {
    const chart = generateTuViChart({
      fullName: "Kiều Tấn Cường",
      gender: "male",
      calendarType: "solar",
      day: 7,
      month: 5,
      year: 1995,
      birthHour: 4,
      viewYear: 2026,
      timezone: "Asia/Bangkok",
    });

    expect(chart.lunar).toMatchObject({ day: 8, month: 4, year: 1995 });
    expect(chart.boneWeight.parts).toEqual({ year: 9, month: 9, day: 16, hour: 7 });
    expect(chart.boneWeight.label).toBe("4 lượng 1 chỉ");
  });
});
