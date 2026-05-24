import { afterEach, describe, expect, it } from "vitest";
import {
  FREE_OVERVIEW_MAX_WORDS,
  FREE_OVERVIEW_MIN_WORDS,
  PAID_FULL_WORD_TARGET,
  generateFreeOverview,
  generateReading,
  getDeepReadingSummary,
  isCompletePaidChapter,
  paidReadingChapterPrompt,
  paidReadingChapters,
} from "@/lib/ai";
import { generateTuViChart } from "@/lib/chart";

const oldGatewayKey = process.env.AI_GATEWAY_API_KEY;
const oldOidcToken = process.env.VERCEL_OIDC_TOKEN;
const oldGeminiKey = process.env.GEMINI_API_KEY;
const oldGeminiKeys = process.env.GEMINI_API_KEYS;
const oldGroqKey = process.env.GROQ_API_KEY;
const oldGroqKeys = process.env.GROQ_API_KEYS;

function clearProviderEnv() {
  delete process.env.AI_GATEWAY_API_KEY;
  delete process.env.VERCEL_OIDC_TOKEN;
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEYS;
  delete process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEYS;
}

function restore(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

function sampleChart(gender: "male" | "female" = "female") {
  return generateTuViChart({
    fullName: gender === "female" ? "Nguyễn Minh Anh" : "Kiều Tấn Cường",
    gender,
    calendarType: "solar",
    day: 19,
    month: 5,
    year: gender === "female" ? 1990 : 1968,
    birthHour: 8,
    viewYear: 2026,
    timezone: "Asia/Bangkok",
  });
}

afterEach(() => {
  restore("AI_GATEWAY_API_KEY", oldGatewayKey);
  restore("VERCEL_OIDC_TOKEN", oldOidcToken);
  restore("GEMINI_API_KEY", oldGeminiKey);
  restore("GEMINI_API_KEYS", oldGeminiKeys);
  restore("GROQ_API_KEY", oldGroqKey);
  restore("GROQ_API_KEYS", oldGroqKeys);
});

describe("AI reading format", () => {
  it("asks the free overview LLM prompt for a long single-request reading", async () => {
    clearProviderEnv();

    const { prompt } = await generateFreeOverview(sampleChart());

    expect(prompt).toContain(String(FREE_OVERVIEW_MIN_WORDS));
    expect(prompt).toContain(String(FREE_OVERVIEW_MAX_WORDS));
    expect(prompt).toContain("1 prompt");
    expect(prompt).toContain("Tóm tắt nhanh");
    expect(prompt).toContain("**Điểm nổi bật:**");
    expect(prompt).toContain("**Cần lưu ý:**");
    expect(prompt).toContain("QUY TẮC ĐỘ DÀI");
  });

  it("defines the full paid reading as 8 fixed chapters", () => {
    const chart = sampleChart();
    const chapters = paidReadingChapters(chart, "FULL");

    expect(chapters).toHaveLength(8);
    expect(chapters.map((chapter) => chapter.title)).toEqual([
      "Chương 1: Tổng quan lá số",
      "Chương 2: Mệnh, Thân và khí chất cốt lõi",
      "Chương 3: 12 cung trọng yếu",
      "Chương 4: Công việc và định hướng sự nghiệp",
      "Chương 5: Tài chính và cách quản trị tiền bạc",
      "Chương 6: Tình cảm, hôn nhân, gia đình",
      "Chương 7: Sức khỏe, tinh thần, nhịp sống",
      "Chương 8: Vận hạn năm 2026 và gợi ý theo từng tháng",
    ]);
    expect(chapters.every((chapter) => chapter.requiredSections.includes("Dữ kiện lá số đã dùng"))).toBe(true);
    expect(chapters.every((chapter) => chapter.requiredSections.includes("Gợi ý hành động"))).toBe(true);
  });

  it("builds paid prompts with word target, address, star states and yearly-star requirements", () => {
    const chart = sampleChart("male");
    const chapters = paidReadingChapters(chart, "FULL");
    const yearlyChapter = chapters.at(-1);
    expect(yearlyChapter).toBeDefined();

    const prompt = paidReadingChapterPrompt(
      chart,
      "FULL",
      "all",
      { title: "Luận giải toàn bộ", evidence: ["Mệnh: Sơn đầu Hỏa", "Lưu niên: L.Kình Dương (H)"] },
      yearlyChapter!,
      7,
      chapters.length,
    );

    expect(prompt).toContain(PAID_FULL_WORD_TARGET);
    expect(prompt).toContain("Xưng hô ưu tiên");
    expect(prompt).toContain("chú");
    expect(prompt).toContain("(M/V/Đ/B/H)");
    expect(prompt).toContain("sao lưu niên");
    expect(prompt).toContain("đủ 12 tháng");
    expect(prompt).toContain("Không tự tính lại lá số");
  });

  it("guides paid readings away from generic Barnum copy and toward concrete value", () => {
    const chart = sampleChart("male");
    const chapters = paidReadingChapters(chart, "PALACE");
    const prompt = paidReadingChapterPrompt(
      chart,
      "PALACE",
      "Mệnh",
      { title: "Cung Mệnh", evidence: ["Mệnh có Thiên Tướng (H)", "Thân cư Mệnh"] },
      chapters[0],
      0,
      chapters.length,
    );

    expect(prompt).toContain("Tránh hiệu ứng Barnum");
    expect(prompt).toContain("tình huống cụ thể");
    expect(prompt).toContain("vũ khí");
    expect(prompt).toContain("cạm bẫy");
    expect(prompt).toContain("thuật ngữ tử vi phải đi kèm diễn giải đời sống");
    expect(prompt).toContain("Actionable Advice");
  });

  it("adapts past fate readings into present-cause and future-direction prompts", () => {
    const chart = sampleChart();
    const chapters = paidReadingChapters(chart, "TIEU_VAN");
    const prompt = paidReadingChapterPrompt(
      chart,
      "TIEU_VAN",
      "tieu-2023",
      { title: "Tiểu vận năm 2023", evidence: ["Lưu niên có Kình Dương, Tuế Phá", "Văn Xương, Văn Khúc hội chiếu"] },
      chapters[0],
      0,
      chapters.length,
    );

    expect(prompt).toContain("Phạm vi này nằm trong quá khứ so với năm xem 2026");
    expect(prompt).toContain("không khuyên người đọc làm việc trong năm đã qua");
    expect(prompt).toContain("Quá khứ -> nguyên nhân hiện tại -> định hướng tương lai");
    expect(prompt).toContain('không dùng cụm "có thể bạn đã"');
    expect(prompt).toContain("tàn dư của giai đoạn cũ");
  });

  it("uses focused section format for palace and fate item readings", () => {
    const chart = sampleChart();
    const chapters = paidReadingChapters(chart, "PALACE");
    const prompt = paidReadingChapterPrompt(
      chart,
      "PALACE",
      "Mệnh",
      { title: "Cung Mệnh", evidence: ["Mệnh có Thiên Tướng (H)"] },
      chapters[0],
      0,
      chapters.length,
    );

    expect(chapters).toHaveLength(1);
    expect(chapters[0].title).not.toContain("Chương");
    expect(chapters[0].requiredSections).toEqual(["Tóm tắt dễ hiểu", "Dữ kiện tử vi đã dùng", "Luận giải theo đời sống", "Điều cần lưu ý", "Gợi ý nên làm"]);
    expect(prompt).toContain("# Luận cung: Mệnh");
    expect(prompt).toContain("phần luận giải");
  });

  it("builds a focused paid prompt for yearly minor fate readings", () => {
    const chart = sampleChart();
    const chapters = paidReadingChapters(chart, "TIEU_VAN");
    const prompt = paidReadingChapterPrompt(
      chart,
      "TIEU_VAN",
      "tieu-2026",
      { title: "Tiểu vận năm 2026", evidence: ["Nền đại vận: 34-43 tuổi tại cung Quan Lộc"] },
      chapters[0],
      0,
      chapters.length,
    );

    expect(chapters).toHaveLength(1);
    expect(chapters[0].title).toBe("Luận tiểu vận");
    expect(chapters[0].instruction).toContain("năm đang mở khóa");
    expect(prompt).toContain("# Luận tiểu vận: tieu-2026");
    expect(prompt).toContain("Tiểu vận năm 2026");
    expect(prompt).toContain("BẮT BUỘC độ dài riêng phần này");
    expect(prompt).toContain("ít nhất 3 bullet hành động");
  });

  it("rejects paid chapters that are too short or miss required sections", () => {
    const chart = sampleChart();
    const chapter = paidReadingChapters(chart, "TIEU_VAN")[0];
    const filler = Array.from({ length: 560 }, (_, index) => `ý-${index}`).join(" ");
    const complete = `# Luận tiểu vận: tieu-2026

## Tóm tắt dễ hiểu
${filler}

## Dữ kiện tử vi đã dùng
- Mệnh, Thân, đại vận và sao lưu năm đã được đối chiếu.

## Luận giải theo đời sống
${filler}

## Điều cần lưu ý
- Không kết luận tuyệt đối.
- Quản trị giấy tờ, tiền bạc và sức khỏe.

## Gợi ý nên làm
- Chọn một việc quan trọng nhất trong quý tới.
- Tránh mở rộng khi nguồn lực chưa rõ.
- Kiểm tra lại kế hoạch sau mỗi tháng.`;

    expect(isCompletePaidChapter("# Luận tiểu vận\n\n## Tóm tắt dễ hiểu\nQuá ngắn.", chapter)).toBe(false);
    expect(isCompletePaidChapter(complete.replace("## Điều cần lưu ý", "## Lưu ý"), chapter)).toBe(false);
    expect(isCompletePaidChapter(complete, chapter)).toBe(true);
  });

  it("returns a structured 8-chapter fallback when no LLM provider is configured", async () => {
    clearProviderEnv();

    const { content, prompt, model } = await generateReading(sampleChart(), "FULL", "all");
    const chapters = paidReadingChapters(sampleChart(), "FULL");

    expect(model).toBe("template-fallback");
    for (const chapter of chapters) {
      expect(content).toContain(`# ${chapter.title}`);
    }
    expect(content).toContain("## Dữ kiện lá số đã dùng");
    expect(content).toContain("## Luận giải chính");
    expect(content).toContain("## Điều nên lưu ý");
    expect(content).toContain("## Gợi ý hành động");
    expect(content).toContain("Gợi ý 12 tháng");
    expect(prompt).toContain("paid-reading-chapters-v3");
  });

  it("computes 5 directional score groups for the advanced report header", () => {
    const summary = getDeepReadingSummary(sampleChart());

    expect(summary.scores).toHaveLength(5);
    expect(summary.scores.map((score) => score.label)).toEqual(["Công việc", "Tài chính", "Tình cảm", "Sức khỏe", "Vận năm"]);
    expect(summary.scores.every((score) => score.value >= 35 && score.value <= 92)).toBe(true);
  });
});
