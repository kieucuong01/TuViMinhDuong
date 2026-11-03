import { describe, expect, it } from "vitest";
import { generateTuViChart } from "@/lib/chart";
import {
  FREE_READING_CONTENT_BLOCKS,
  buildFreeOverviewFromInterpretationRules,
  buildFreeReadingSections,
  extractFreeReadingSignals,
} from "@/lib/free-overview-engine";
import { countVisibleMarkdownWords } from "@/lib/free-overview-presentation";
import { MAIN_INTERPRETATION_STARS } from "@/lib/interpretation-rules";
import { isCompleteFreeOverview, isCompleteFreeOverviewBlock, splitFreeOverviewBlocks } from "@/lib/ai";

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
  it("keeps different real charts complete without padding or losing the evidence", () => {
    for (const hour of [0, 1, 4, 7, 10, 13, 16, 19, 22, 23]) {
      const chart = makeChart("Người xem thử", "female", 7, 5, 1995, hour);
      const content = buildFreeOverviewFromInterpretationRules(chart);
      const blocks = splitFreeOverviewBlocks(content).blocks;
      const counts = Object.entries(blocks).map(([key, body]) => `${key}: ${countVisibleMarkdownWords(body)}`).join(", ");
      expect(isCompleteFreeOverview(content), `hour ${hour}, words ${countVisibleMarkdownWords(content)}, ${counts}`).toBe(true);
      for (const [key, body] of Object.entries(blocks)) {
        expect(isCompleteFreeOverviewBlock(key as keyof typeof blocks, chart, body), `${key}, hour ${hour}, ${counts}`).toBe(true);
      }
      expect(content.match(/Căn cứ từ lá số:/gu)).toHaveLength(4);
      expect(content.match(/Để tự đối chiếu/gu)).toHaveLength(4);
      expect(content).not.toMatch(/năng lượng|chất liệu|bản lề|hố đen tài chính|bản án/iu);
    }
  });

  it("uses the existing star-and-palace rules instead of identical default praise", () => {
    const openings = new Set<string>();
    for (const star of MAIN_INTERPRETATION_STARS) {
      const chart = { ...sampleChart, palaces: sampleChart.palaces.map((palace) =>
        palace.name === "Mệnh" ? { ...palace, mainStars: [star] } : palace) };
      openings.add(buildFreeReadingSections(chart)[0].freeText);
    }
    expect(openings.size).toBe(MAIN_INTERPRETATION_STARS.length);
  });

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

  it("uses specific unanswered questions as premium hooks instead of generic upgrade copy", () => {
    const collections = [
      FREE_READING_CONTENT_BLOCKS.cung_menh.chinh_tinh,
      FREE_READING_CONTENT_BLOCKS.cung_tai_bach.dong_tien_chinh,
      FREE_READING_CONTENT_BLOCKS.cung_quan_loc.moi_truong,
      FREE_READING_CONTENT_BLOCKS.van_han.nam,
    ];

    for (const block of collections.flatMap((collection) => Object.values(collection))) {
      expect(block.premium_hook).not.toMatch(/^Premium mở/iu);
      expect(block.premium_hook).toMatch(/\?$/u);
    }
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
      expect(section.freeText).toContain(section.quickTake);
      expect(section.evidenceText).toMatch(/cung|Mệnh\/Thân\/Cục|đại vận/iu);
      expect(section.practicalTip.length).toBeGreaterThan(80);
      expect(section.premiumHook).toMatch(/\?$/u);
    }
  });

  it("assembles the final free report as a deeper evidence-based paid-conversion preview", () => {
    const overview = buildFreeOverviewFromInterpretationRules(sampleChart);

    expect(overview).toContain("# Luận giải miễn phí dành cho Kiều Tấn Cường");
    expect(overview).toContain("Hồ sơ: Kiều Tấn Cường");
    expect(overview).toContain("Bản Mệnh:");
    expect(overview).toContain("## 1. Năng lực thiên phú (Cung Mệnh)");
    expect(overview).toContain("## 2. Phong cách kiếm tiền (Cung Tài Bạch)");
    expect(overview).toContain("## 3. Môi trường làm việc lý tưởng (Cung Quan Lộc)");
    expect(overview).toContain("## 4. Vận hạn năm 2026 (Năm Bính Ngọ)");
    expect(overview.match(/🔒 Nâng cấp Premium để xem:/gu)).toHaveLength(4);
    expect(overview.match(/^[-*]\s+\S/gmu)?.length).toBeGreaterThanOrEqual(12);
    expect(overview).toContain("Đọc tiếp bản chuyên sâu");
    expect(overview).toContain("Xem bản chuyên sâu khi bạn muốn tìm hiểu thêm.");
    expect(overview).toContain("Bản FULL 9 chương");
    expect(overview).toContain("lộ trình 12 tháng");
    expect(overview).toContain("kế hoạch 30/90 ngày");
    expect(overview).toContain("3 câu hỏi với Cố vấn AI");
    expect(overview).toMatch(/Triệt|Linh Tinh/u);
    expect(overview).not.toContain("**Đọc nhanh:**");
    expect(overview).not.toContain("**Lợi thế nổi bật:**");
    expect(overview).not.toContain("**Điểm dễ vướng:**");
    expect(overview).not.toContain("**Vì sao có nhận định này:**");
    expect(overview).not.toContain("**Gợi ý thực tế:**");
    expect(overview).not.toContain("[Block Nội dung -");
    expect(overview).toContain(sampleChart.palaces.find((palace) => palace.name === "Mệnh")?.branch);
    expect(overview).not.toContain("lắp ghép các khối nội dung");
    expect(countVisibleMarkdownWords(overview)).toBeGreaterThanOrEqual(950);
    expect(countVisibleMarkdownWords(overview)).toBeLessThanOrEqual(1550);
  });
});
