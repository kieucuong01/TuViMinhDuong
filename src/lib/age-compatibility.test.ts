import { describe, expect, it } from "vitest";
import {
  analyzeKetHon,
  analyzeLamNha,
  comparePeople,
  profileFromLunarYear,
  profileFromSolarDate,
} from "@/lib/age-compatibility";

describe("age profile", () => {
  it("keeps the 60-year Can-Chi and Nạp âm cycle", () => {
    expect(profileFromLunarYear(1984).canChi).toBe("Giáp Tý");
    expect(profileFromLunarYear(1984).napAm).toBe("Hải Trung Kim");
    expect(profileFromLunarYear(2044).canChi).toBe("Giáp Tý");
    expect(profileFromLunarYear(2044).napAm).toBe("Hải Trung Kim");
    expect(profileFromLunarYear(2026).canChi).toBe("Bính Ngọ");
    expect(profileFromLunarYear(2026).napAm).toBe("Thiên Hà Thủy");
  });

  it("uses the Vietnamese lunar year around Tết", () => {
    expect(profileFromSolarDate("2026-02-16").lunarYear).toBe(2025);
    expect(profileFromSolarDate("2026-02-17").lunarYear).toBe(2026);
  });

  it("computes the approved Cung Phi fixtures", () => {
    expect(profileFromLunarYear(1990, "male").cungPhi?.name).toBe("Khảm");
    expect(profileFromLunarYear(1990, "female").cungPhi?.name).toBe("Cấn");
    expect(profileFromLunarYear(1995, "male").cungPhi?.name).toBe("Khôn");
    expect(profileFromLunarYear(1995, "female").cungPhi?.name).toBe("Khảm");
    expect(profileFromLunarYear(2000, "male").cungPhi?.name).toBe("Ly");
    expect(profileFromLunarYear(2000, "female").cungPhi?.name).toBe("Càn");
  });
});

describe("age relationships", () => {
  it("does not call identical branches Tam Hợp", () => {
    const report = comparePeople(profileFromLunarYear(1990), profileFromLunarYear(1930));
    const branch = report.criteria.find((item) => item.key === "dia-chi");

    expect(branch?.explanation).toContain("đồng chi Ngọ");
    expect(branch?.explanation).not.toContain("tam hợp");
  });

  it.each([
    [1984, 1985, "lục hợp"],
    [1984, 1988, "tam hợp"],
    [1984, 1990, "lục xung"],
    [1984, 1991, "tương hại"],
    [1984, 1993, "tương phá"],
  ])("recognizes the branch relation for %i and %i", (leftYear, rightYear, phrase) => {
    const report = comparePeople(profileFromLunarYear(leftYear), profileFromLunarYear(rightYear));
    expect(report.criteria.find((item) => item.key === "dia-chi")?.explanation).toContain(phrase);
  });

  it("distinguishes generating, controlling and equal Nạp âm elements", () => {
    const equal = comparePeople(profileFromLunarYear(1984), profileFromLunarYear(1985));
    const generating = comparePeople(profileFromLunarYear(1988), profileFromLunarYear(1986));
    const controlling = comparePeople(profileFromLunarYear(1984), profileFromLunarYear(1986));

    expect(equal.criteria.find((item) => item.key === "nap-am")?.status).toBe("neutral");
    expect(generating.criteria.find((item) => item.key === "nap-am")?.status).toBe("favorable");
    expect(controlling.criteria.find((item) => item.key === "nap-am")?.status).toBe("caution");
  });
});

describe("year selection rules", () => {
  it("uses transparent Kim Lâu remainders", () => {
    const years = analyzeKetHon("2000-06-01", "female", 2026, 2034).years;
    const remainderByYear = new Map(years.map((item) => [item.year, item.details.kimLau.remainder]));

    expect(remainderByYear.get(2026)).toBe(0);
    expect(remainderByYear.get(2027)).toBe(1);
    expect(remainderByYear.get(2029)).toBe(3);
    expect(remainderByYear.get(2032)).toBe(6);
    expect(remainderByYear.get(2034)).toBe(8);
  });

  it.each([
    ["1980-06-01", 2034],
    ["1986-06-01", 2028],
    ["1983-06-01", 2037],
    ["1989-06-01", 2031],
  ])("recognizes all four Tam Tai groups", (birthDate, targetYear) => {
    const result = analyzeLamNha(birthDate, "male", targetYear, targetYear).years[0];
    expect(result.details.tamTai.active).toBe(true);
  });

  it("uses the six-position Hoang Ốc cycle", () => {
    const names = [2017, 2007, 1997, 1987, 1977, 1967].map((birthYear) =>
      analyzeLamNha(`${birthYear}-06-01`, "male", 2026, 2026).years[0].details.hoangOc.name,
    );

    expect(names).toEqual([
      "Nhất Cát",
      "Nhì Nghi",
      "Tam Địa Sát",
      "Tứ Tấn Tài",
      "Ngũ Thọ Tử",
      "Lục Hoang Ốc",
    ]);
    expect(analyzeLamNha("1996-06-01", "male", 2026, 2026).years[0].details.hoangOc.name).toBe("Tứ Tấn Tài");
  });
});
