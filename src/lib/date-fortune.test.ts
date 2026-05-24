import { describe, expect, it } from "vitest";
import { analyzeDate, getVietnameseDateHighlight, monthDays } from "@/lib/date-fortune";

describe("date fortune engine", () => {
  it("computes almanac layers for a known reference day", () => {
    const fortune = analyzeDate(new Date("2026-05-20T12:00:00+07:00"));

    expect(fortune.lunar).toMatchObject({ day: 4, month: 4, year: 2026, leap: false });
    expect(fortune.canChi).toEqual({
      year: "Bính Ngọ",
      month: "Quý Tỵ",
      day: "Giáp Ngọ",
    });
    expect(fortune.direct).toBe("Trừ");
    expect(fortune.zodiac).toMatchObject({ name: "Thanh Long", type: "Hoàng đạo" });
    expect(fortune.mansion).toMatchObject({ name: "Sâm", fullName: "Sâm Thủy Viên" });
    expect(fortune.goodStars.map((star) => star.name)).toContain("Thiên Xá");
    expect(fortune.taskScores).toHaveLength(6);
  });

  it("applies age relation when birth year is provided", () => {
    const fortune = analyzeDate(new Date("2026-05-20T12:00:00+07:00"), 1996);

    expect(fortune.ageRelation?.canChi).toBe("Bính Tý");
    expect(fortune.ageRelation?.notes.join(" ")).toContain("lục xung");
    expect(fortune.taskScores.some((task) => task.badSignals.some((signal) => signal.includes("lục xung")))).toBe(true);
  });

  it("builds a full month with one computed record per day", () => {
    const days = monthDays(2026, 5);

    expect(days).toHaveLength(31);
    expect(days[19].solar.day).toBe(20);
    expect(days[19].mansion.name).toBe("Sâm");
  });

  it("returns Vietnamese solar and lunar date highlights", () => {
    expect(getVietnameseDateHighlight(new Date("2026-05-19T12:00:00+07:00"))).toMatchObject({
      label: "Ngày sinh Chủ tịch Hồ Chí Minh",
      tone: "memorial",
    });

    expect(getVietnameseDateHighlight(new Date("2026-04-26T12:00:00+07:00"))).toMatchObject({
      label: "Giỗ Tổ Hùng Vương",
      tone: "national",
    });
  });
});
