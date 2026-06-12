import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FREE_OVERVIEW_MAX_WORDS,
  FREE_OVERVIEW_MAX_TOKENS,
  FREE_OVERVIEW_MIN_WORDS,
  PAID_FULL_WORD_TARGET,
  PAID_READING_CHAPTER_MAX_TOKENS,
  type PaidReadingChapter,
  type PaidReadingGenerationProgress,
  buildInstantFreeOverview,
  countWords,
  generateFreeOverview,
  generateReading,
  generateReadingWithProgress,
  getDeepReadingSummary,
  isCompletePaidChapter,
  paidReadingChapterPrompt,
  paidReadingChapters,
  paidReadingMaxTokens,
  runReadingChapterTasks,
} from "@/lib/ai";
import { generateTuViChart } from "@/lib/chart";

const llmRouterMocks = vi.hoisted(() => ({
  generateWithLlmRouter: vi.fn(),
  hasExternalLlmProvider: vi.fn(() => false),
}));

vi.mock("@/lib/llm-router", () => ({
  generateWithLlmRouter: llmRouterMocks.generateWithLlmRouter,
  hasExternalLlmProvider: llmRouterMocks.hasExternalLlmProvider,
}));

const oldGatewayKey = process.env.AI_GATEWAY_API_KEY;
const oldOidcToken = process.env.VERCEL_OIDC_TOKEN;
const oldGeminiKey = process.env.GEMINI_API_KEY;
const oldGeminiKeys = process.env.GEMINI_API_KEYS;
const oldGroqKey = process.env.GROQ_API_KEY;
const oldGroqKeys = process.env.GROQ_API_KEYS;
const oldPaidPrimaryGeminiModel = process.env.PAID_READING_PRIMARY_GEMINI_MODEL;
const oldPaidEscalationGeminiModel = process.env.PAID_READING_ESCALATION_GEMINI_MODEL;
const oldPaidYearlyGeminiModel = process.env.PAID_READING_YEARLY_GEMINI_MODEL;

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

function completeGeneratedChapter(chapter: PaidReadingChapter, marker: string) {
  const filler = Array.from({ length: 720 }, (_, index) => `${marker}-word-${index}`).join(" ");
  const monthLines =
    chapter.key === "yearly-months"
      ? Array.from({ length: 12 }, (_, index) => `- Thang ${index + 1}: uu tien viec ro rang, tranh quyet dinh voi.`).join("\n")
      : "";

  return `# ${chapter.title}

## ${chapter.requiredSections[0]}
- ${marker} evidence.

## ${chapter.requiredSections[1]}
${filler}

## ${chapter.requiredSections[2]}
- ${marker} risk note.
- Kiem tra tien bac va giay to.

## ${chapter.requiredSections[3]}
- ${marker} action one.
- ${marker} action two.
- ${marker} action three.
${monthLines ? `\n${monthLines}` : ""}`;
}

beforeEach(() => {
  llmRouterMocks.generateWithLlmRouter.mockReset();
  llmRouterMocks.hasExternalLlmProvider.mockReset();
  llmRouterMocks.hasExternalLlmProvider.mockReturnValue(false);
});

afterEach(() => {
  restore("AI_GATEWAY_API_KEY", oldGatewayKey);
  restore("VERCEL_OIDC_TOKEN", oldOidcToken);
  restore("GEMINI_API_KEY", oldGeminiKey);
  restore("GEMINI_API_KEYS", oldGeminiKeys);
  restore("GROQ_API_KEY", oldGroqKey);
  restore("GROQ_API_KEYS", oldGroqKeys);
  restore("PAID_READING_PRIMARY_GEMINI_MODEL", oldPaidPrimaryGeminiModel);
  restore("PAID_READING_ESCALATION_GEMINI_MODEL", oldPaidEscalationGeminiModel);
  restore("PAID_READING_YEARLY_GEMINI_MODEL", oldPaidYearlyGeminiModel);
});

describe("AI reading format", () => {
  it("runs paid reading chapter jobs with a bounded parallelism limit while preserving result order", async () => {
    let active = 0;
    let maxActive = 0;
    const completionOrder: number[] = [];

    const result = await runReadingChapterTasks([0, 1, 2, 3, 4, 5, 6, 7], 3, async (value) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 10 - value));
      completionOrder.push(value);
      active -= 1;
      return `chapter-${value}`;
    });

    expect(maxActive).toBeLessThanOrEqual(3);
    expect(completionOrder).not.toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(result).toEqual(["chapter-0", "chapter-1", "chapter-2", "chapter-3", "chapter-4", "chapter-5", "chapter-6", "chapter-7"]);
  });

  it("falls back only the failed full-reading chapter after the escalated retry also fails", async () => {
    clearProviderEnv();
    llmRouterMocks.hasExternalLlmProvider.mockReturnValue(true);

    const chart = sampleChart();
    const chapters = paidReadingChapters(chart, "FULL");
    const failedChapter = chapters[4];
    const progressSnapshots: PaidReadingGenerationProgress[] = [];
    let active = 0;
    let maxActive = 0;

    llmRouterMocks.generateWithLlmRouter.mockImplementation(async ({ prompt }: { prompt: string }) => {
      const chapter = chapters.find((item) => prompt.includes(item.title));
      if (!chapter) throw new Error("Unknown chapter prompt");

      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, chapter.key === failedChapter.key ? 5 : 15));
      active -= 1;

      if (chapter.key === failedChapter.key) throw new Error("chapter format exploded");
      return {
        text: completeGeneratedChapter(chapter, `generated-${chapter.key}`),
        model: `mock-${chapter.key}`,
        provider: "gemini",
      };
    });

    const result = await generateReadingWithProgress(chart, "FULL", "all", (progress) => {
      progressSnapshots.push(progress);
    });
    const promptMeta = JSON.parse(result.prompt);
    const failedChapterMeta = promptMeta.chapters.find((chapter: { key: string }) => chapter.key === failedChapter.key);
    const successfulChapterMeta = promptMeta.chapters.find((chapter: { key: string }) => chapter.key === chapters[0].key);

    expect(maxActive).toBeLessThanOrEqual(3);
    expect(llmRouterMocks.generateWithLlmRouter).toHaveBeenCalledTimes(9);
    expect(result.content).toContain(`generated-${chapters[0].key}`);
    expect(result.content).toContain(`# ${failedChapter.title}`);
    expect(result.content).not.toContain(`generated-${failedChapter.key}`);
    expect(failedChapterMeta).toMatchObject({ key: failedChapter.key, formatGuarded: true });
    expect(String(failedChapterMeta.model)).toContain("template-fallback");
    expect(successfulChapterMeta).toMatchObject({ key: chapters[0].key, formatGuarded: false });
    expect(progressSnapshots).toHaveLength(8);
    expect(progressSnapshots.at(-1)?.completedChapters).toHaveLength(8);
  });

  it("routes paid chapters through Groq first while preserving Gemini model choices for fallback", async () => {
    clearProviderEnv();
    llmRouterMocks.hasExternalLlmProvider.mockReturnValue(true);

    const chart = sampleChart();
    const chapters = paidReadingChapters(chart, "FULL");
    const weakChapter = chapters.find((chapter) => chapter.key === "money")!;
    const yearlyChapter = chapters.find((chapter) => chapter.key === "yearly-months")!;
    const attemptsByKey = new Map<string, number>();

    llmRouterMocks.generateWithLlmRouter.mockImplementation(async (options: { prompt: string; geminiModel?: string }) => {
      const chapter = chapters.find((item) => options.prompt.includes(item.title));
      if (!chapter) throw new Error("Unknown chapter prompt");

      const attempt = (attemptsByKey.get(chapter.key) || 0) + 1;
      attemptsByKey.set(chapter.key, attempt);

      if (chapter.key === weakChapter.key && attempt === 1) {
        return {
          text: `# ${chapter.title}\n\n## ${chapter.requiredSections[0]}\nToo short.`,
          model: "groq/llama-3.1-8b-instant",
          provider: "groq",
        };
      }

      return {
        text: completeGeneratedChapter(chapter, `generated-${chapter.key}-attempt-${attempt}`),
        model: "groq/llama-3.1-8b-instant",
        provider: "groq",
      };
    });

    const result = await generateReadingWithProgress(chart, "FULL", "all");
    const promptMeta = JSON.parse(result.prompt);
    const weakChapterMeta = promptMeta.chapters.find((chapter: { key: string }) => chapter.key === weakChapter.key);
    const weakChapterCalls = llmRouterMocks.generateWithLlmRouter.mock.calls.filter(([options]) =>
      String((options as { prompt: string }).prompt).includes(weakChapter.title),
    );
    const yearlyCalls = llmRouterMocks.generateWithLlmRouter.mock.calls.filter(([options]) =>
      String((options as { prompt: string }).prompt).includes(yearlyChapter.title),
    );

    expect(weakChapterCalls).toHaveLength(2);
    expect((weakChapterCalls[0][0] as { providerOrder?: string[] }).providerOrder).toBeUndefined();
    expect((weakChapterCalls[1][0] as { providerOrder?: string[] }).providerOrder).toBeUndefined();
    expect((weakChapterCalls[0][0] as { geminiModel?: string }).geminiModel).toBe("gemini-2.5-flash");
    expect((weakChapterCalls[1][0] as { geminiModel?: string }).geminiModel).toBe("gemini-3.5-flash");
    expect(yearlyCalls).toHaveLength(1);
    expect((yearlyCalls[0][0] as { geminiModel?: string }).geminiModel).toBe("gemini-3.5-flash");
    expect(result.content).toContain(`generated-${weakChapter.key}-attempt-2`);
    expect(weakChapterMeta).toMatchObject({ key: weakChapter.key, model: "groq/llama-3.1-8b-instant", formatGuarded: false });
  });

  it("asks the free overview LLM prompt for a long single-request reading", async () => {
    clearProviderEnv();

    const { prompt } = await generateFreeOverview(sampleChart());

    expect(prompt).toContain(String(FREE_OVERVIEW_MIN_WORDS));
    expect(prompt).toContain(String(FREE_OVERVIEW_MAX_WORDS));
    expect(FREE_OVERVIEW_MIN_WORDS).toBeLessThanOrEqual(900);
    expect(FREE_OVERVIEW_MAX_WORDS).toBeLessThanOrEqual(1200);
    expect(FREE_OVERVIEW_MAX_TOKENS).toBeLessThanOrEqual(5000);
    expect(prompt).toContain("1 prompt");
    expect(prompt).toContain("Tóm tắt nhanh");
    expect(prompt).toContain("**Điểm nổi bật:**");
    expect(prompt).toContain("**Cần lưu ý:**");
    expect(prompt).toContain("QUY TẮC ĐỘ DÀI");
  });

  it("renders a useful instant free overview before the background LLM finishes", () => {
    const chart = sampleChart("male");
    const content = buildInstantFreeOverview(chart);

    expect(countWords(content)).toBeGreaterThanOrEqual(600);
    expect(countWords(content)).toBeLessThanOrEqual(950);
    expect(content).toContain("## Tổng quan miễn phí");
    expect(content).toContain("## Mệnh và Thân nói gì");
    expect(content).toContain("## Điểm mạnh dễ phát huy");
    expect(content).toContain("## Điều nên lưu ý");
    expect(content).toContain(`## Gợi ý cho năm ${chart.input.viewYear}`);
    expect(content).toContain(chart.input.fullName);
    expect(content).toContain(chart.menh);
    expect(content).toContain(chart.than);
    expect(content).not.toContain(PAID_FULL_WORD_TARGET);
    expect(content).not.toContain("## Luận giải chính");
  });

  it("uses the default Groq-first router for free overview", async () => {
    clearProviderEnv();
    llmRouterMocks.hasExternalLlmProvider.mockReturnValue(true);
    llmRouterMocks.generateWithLlmRouter.mockResolvedValue({
      text: "Groq free overview",
      model: "groq/llama-3.1-8b-instant",
      provider: "groq",
    });

    const result = await generateFreeOverview(sampleChart());

    expect(result.model).toBe("groq/llama-3.1-8b-instant");
    expect(llmRouterMocks.generateWithLlmRouter).toHaveBeenCalledWith(
      expect.objectContaining({
        maxTokens: FREE_OVERVIEW_MAX_TOKENS,
      }),
    );
    expect(llmRouterMocks.generateWithLlmRouter.mock.calls[0][0]).not.toHaveProperty("providerOrder");
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

  it("guides yearly full chapters away from prompt leakage, repeated greetings and robotic monthly loops", () => {
    const chart = sampleChart("male");
    const chapters = paidReadingChapters(chart, "FULL");
    const yearlyChapter = chapters.at(-1)!;
    const prompt = paidReadingChapterPrompt(
      chart,
      "FULL",
      "all",
      { title: "Luận giải toàn bộ", evidence: ["Mệnh: Sơn đầu Hỏa", "Lưu niên: L.Kình Dương (H)"] },
      yearlyChapter,
      7,
      chapters.length,
    );

    expect(prompt).toContain("Không lặp lại lời chào ở đầu chương");
    expect(prompt).toContain("không được in lại nhãn nội bộ");
    expect(prompt).toContain("Bảng ngữ cảnh 12 tháng");
    expect(prompt.match(/Tháng \d+:/g)).toHaveLength(12);
    expect(prompt).toContain("mỗi tháng phải có trọng tâm riêng");
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

  it("keeps focused unlock prompts compact without removing paid-quality guardrails", () => {
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

    expect(prompt).not.toContain("Dữ liệu lá số JSON đầy đủ");
    expect(prompt).not.toContain('"palaces"');
    expect(prompt).toContain("Dữ liệu trọng tâm đã rút gọn");
    expect(prompt).toContain("Tránh hiệu ứng Barnum");
    expect(prompt).toContain("tình huống cụ thể");
    expect(prompt).toContain("vũ khí");
    expect(prompt).toContain("Actionable Advice");
    expect(prompt).toContain("Mệnh");
    expect(prompt).toContain("Thân");
  });

  it("sizes token budgets to each full chapter instead of over-allocating every chapter", () => {
    const chart = sampleChart();
    const fullChapters = paidReadingChapters(chart, "FULL");
    const overviewChapter = fullChapters[0];
    const fullYearChapter = paidReadingChapters(chart, "FULL").at(-1)!;
    const palaceChapter = paidReadingChapters(chart, "PALACE")[0];
    const dailyChapter = paidReadingChapters(chart, "NHAT_VAN")[0];

    expect(paidReadingMaxTokens("FULL", overviewChapter)).toBeLessThan(PAID_READING_CHAPTER_MAX_TOKENS);
    expect(paidReadingMaxTokens("FULL", fullYearChapter)).toBeGreaterThan(paidReadingMaxTokens("FULL", overviewChapter));
    expect(paidReadingMaxTokens("PALACE", palaceChapter)).toBeLessThan(PAID_READING_CHAPTER_MAX_TOKENS);
    expect(paidReadingMaxTokens("NHAT_VAN", dailyChapter)).toBeLessThan(paidReadingMaxTokens("PALACE", palaceChapter));
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
    expect(content).not.toContain("Chương này được dựng từ dữ liệu lá số");
    expect(content).not.toContain("Dữ kiện trọng yếu");

    const monthBodies = Array.from(content.matchAll(/^- Tháng \d+:\s*(.+)$/gm), (match) => match[1]);
    expect(monthBodies).toHaveLength(12);
    expect(new Set(monthBodies).size).toBe(12);
    expect(prompt).toContain("paid-reading-chapters-v3");
  });

  it("computes 5 directional score groups for the advanced report header", () => {
    const summary = getDeepReadingSummary(sampleChart());

    expect(summary.scores).toHaveLength(5);
    expect(summary.scores.map((score) => score.label)).toEqual(["Công việc", "Tài chính", "Tình cảm", "Sức khỏe", "Vận năm"]);
    expect(summary.scores.every((score) => score.value >= 35 && score.value <= 92)).toBe(true);
  });
});
