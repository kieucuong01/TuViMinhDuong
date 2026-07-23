import { describe, expect, it } from "vitest";
import { generateTuViChart } from "@/lib/chart";
import {
  FREE_READING_CONTENT_BLOCKS,
  buildFreeOverviewFromInterpretationRules,
  buildFreeReadingSections,
  extractFreeReadingSignals,
} from "@/lib/free-overview-engine";
import { countVisibleMarkdownWords } from "@/lib/free-overview-presentation";

function makeChart(fullName: string, gender: "male" | "female", day: number, month: number, year: number, birthHour: number) {
  return generateTuViChart({
    fullName,
    gender,
    calendarType: "solar",
    day,
    month,
    year,
    birthHour,
    viewYear: 2026,
    timezone: "Asia/Bangkok",
  });
}

const sampleChart = makeChart("Kiều Tấn Cường", "male", 3, 4, 1995, 1);

describe("free reading block builder", () => {
  it("extracts the four signals used by the free preview", () => {
    const signals = extractFreeReadingSignals(sampleChart);

    expect(signals).toMatchObject({
      profileName: "Kiều Tấn Cường",
      viewYear: 2026,
      lifeYearLabel: expect.stringContaining("1995"),
      destinyLine: expect.stringContaining(sampleChart.menh),
    });
    expect(signals.sections.map((section) => section.key)).toEqual(["menh", "tai_bach", "quan_loc", "van_han"]);
    expect(signals.sections.every((section) => section.palace && section.signalLabel && section.matchKey)).toBe(true);
  });

  it("keeps the free copy in a JSON-style content block library with premium hooks", () => {
    expect(FREE_READING_CONTENT_BLOCKS.cung_menh.chinh_tinh.thien_co).toMatchObject({
      loi_the: expect.stringContaining("Thiên Cơ"),
      rao_can: expect.any(String),
      premium_hook: expect.any(String),
    });

    const serialized = JSON.stringify(FREE_READING_CONTENT_BLOCKS);
    expect(serialized).toContain("loi_the");
    expect(serialized).toContain("rao_can");
    expect(serialized).toContain("premium_hook");
  });

  it("matches extracted signals to four assembled sections with one premium hook per section", () => {
    const sections = buildFreeReadingSections(sampleChart);

    expect(sections.map((section) => section.title)).toEqual([
      "Năng lực thiên phú (Cung Mệnh)",
      "Phong cách kiếm tiền (Cung Tài Bạch)",
      "Môi trường làm việc lý tưởng (Cung Quan Lộc)",
      "Vận hạn năm 2026 (Năm Bính Ngọ)",
    ]);
    expect(sections).toHaveLength(4);
    for (const section of sections) {
      expect(section.freeText.length).toBeGreaterThan(120);
      expect(section.premiumHook).toContain("Premium");
    }
  });

  it("assembles the final free report as a paid-conversion preview, not the old long report", () => {
    const overview = buildFreeOverviewFromInterpretationRules(sampleChart);

    expect(overview).toContain("# Bài mẫu luận giải miễn phí");
    expect(overview).toContain("Hồ sơ: Kiều Tấn Cường");
    expect(overview).toContain("Bản Mệnh:");
    expect(overview).toContain("## 1. Năng lực thiên phú (Cung Mệnh)");
    expect(overview).toContain("## 2. Phong cách kiếm tiền (Cung Tài Bạch)");
    expect(overview).toContain("## 3. Môi trường làm việc lý tưởng (Cung Quan Lộc)");
    expect(overview).toContain("## 4. Vận hạn năm 2026 (Năm Bính Ngọ)");
    expect(overview.match(/🔒 Nâng cấp Premium để xem:/gu)).toHaveLength(4);
    expect(overview).toContain("KHAI MỞ BẢN ĐỒ ĐỘC BẢN CỦA RIÊNG BẠN");
    expect(overview).toContain("MỞ KHÓA BÁO CÁO FULL PREMIUM NGAY");
    expect(overview).not.toContain("### Điểm nổi bật");
    expect(overview).not.toContain("### Vì sao có nhận định này");
    expect(countVisibleMarkdownWords(overview)).toBeGreaterThanOrEqual(520);
    expect(countVisibleMarkdownWords(overview)).toBeLessThanOrEqual(950);
  });
});
