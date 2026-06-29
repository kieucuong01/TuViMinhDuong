import { describe, expect, it } from "vitest";
import { generateTuViChart, type TuViChart } from "@/lib/chart";
import {
  buildChartEvidenceProfile,
  buildPersonalizedReportOutline,
  formatChartEvidence,
} from "@/lib/chart-evidence";

function testChart(): TuViChart {
  return generateTuViChart({
    fullName: "Nguyễn Minh Anh",
    gender: "male",
    calendarType: "solar",
    day: 12,
    month: 8,
    year: 1990,
    birthHour: 9,
    birthMinute: 30,
    viewYear: 2026,
    timezone: "Asia/Ho_Chi_Minh",
  });
}

describe("chart evidence profile", () => {
  it("builds bounded evidence from the computed chart", () => {
    const chart = testChart();
    const profile = buildChartEvidenceProfile(chart);
    const moneyPalace = profile.palaces.find((palace) => palace.name === "Tài Bạch");

    expect(profile.fullName).toBe("Nguyễn Minh Anh");
    expect(profile.viewYear).toBe(2026);
    expect(profile.palaces).toHaveLength(12);
    expect(moneyPalace?.stars.length).toBeGreaterThan(0);
    expect(profile.palaces.every((palace) => palace.stars.length <= 10)).toBe(true);
    expect(profile.signals).toHaveLength(3);
    expect(profile.signals.every((signal) => signal.evidence.length > 0)).toBe(true);
    expect(profile.signals[0].evidence.join(" ")).not.toContain("chưa có dữ liệu");
    expect(formatChartEvidence(profile)).toContain("Tài Bạch");
  });

  it("mentions Tuần or Triệt in the money title only when Tài Bạch contains it", () => {
    const base = testChart();
    const withoutBlockers: TuViChart = {
      ...base,
      palaces: base.palaces.map((palace) =>
        palace.name === "Tài Bạch"
          ? { ...palace, supportStars: palace.supportStars.filter((star) => star !== "Tuần" && star !== "Triệt") }
          : palace,
      ),
    };
    const withTuan: TuViChart = {
      ...withoutBlockers,
      palaces: withoutBlockers.palaces.map((palace) =>
        palace.name === "Tài Bạch"
          ? { ...palace, supportStars: [...palace.supportStars, "Tuần"] }
          : palace,
      ),
    };

    const plainMoneyTitle = buildPersonalizedReportOutline(withoutBlockers).find((item) => item.key === "money")?.title;
    const blockedMoneyTitle = buildPersonalizedReportOutline(withTuan).find((item) => item.key === "money")?.title;

    expect(plainMoneyTitle).not.toMatch(/Tuần|Triệt/);
    expect(blockedMoneyTitle).toContain("Tuần");
  });
});
