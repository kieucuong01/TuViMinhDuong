import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FREE_OVERVIEW_GUEST_TEASER_MAX_CHARS,
  FREE_OVERVIEW_GUEST_TEASER_MIN_CHARS,
  buildFreeOverviewTeaser,
} from "@/lib/free-overview-presentation";
import {
  FREE_OVERVIEW_MAX_WORDS,
  FREE_OVERVIEW_MAX_TOKENS,
  FREE_OVERVIEW_MIN_WORDS,
  FREE_OVERVIEW_PREVIEW_MAX_WORDS,
  FREE_OVERVIEW_PREVIEW_MIN_WORDS,
  PAID_FULL_WORD_TARGET,
  PAID_READING_CHAPTER_MAX_TOKENS,
  type PaidReadingChapter,
  type PaidReadingGenerationProgress,
  buildPaidActionPlanContext,
  buildInstantFreeOverview,
  countWords,
  generateFreeOverview,
  generateFreeOverviewPreview,
  generateReading,
  generateReadingWithProgress,
  getDeepReadingSummary,
  isCompleteFreeOverview,
  isCompleteFreeOverviewPreview,
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

const oldDeepSeekKey = process.env.DEEPSEEK_API_KEY;
const oldDeepSeekKeys = process.env.DEEPSEEK_API_KEYS;
const oldGroqKey = process.env.GROQ_API_KEY;
const oldGroqKeys = process.env.GROQ_API_KEYS;

function clearProviderEnv() {
  delete process.env.DEEPSEEK_API_KEY;
  delete process.env.DEEPSEEK_API_KEYS;
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

function youngSampleChart() {
  return generateTuViChart({
    fullName: "Nguyễn Hồ Bảo Linh",
    gender: "female",
    calendarType: "solar",
    day: 12,
    month: 8,
    year: 2008,
    birthHour: 7,
    birthMinute: 0,
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

  const sections = chapter.requiredSections.map((section, index) => {
    const body = index === 1
      ? filler
      : `- **${marker} key ${index + 1}.**
- ${marker} action ${index + 1}.`;
    return `## ${section}\n${body}`;
  }).join("\n\n");

  return `# ${chapter.title}\n\n${sections}${monthLines ? `\n\n${monthLines}` : ""}`;
}

beforeEach(() => {
  llmRouterMocks.generateWithLlmRouter.mockReset();
  llmRouterMocks.hasExternalLlmProvider.mockReset();
  llmRouterMocks.hasExternalLlmProvider.mockReturnValue(false);
});

afterEach(() => {
  restore("DEEPSEEK_API_KEY", oldDeepSeekKey);
  restore("DEEPSEEK_API_KEYS", oldDeepSeekKeys);
  restore("GROQ_API_KEY", oldGroqKey);
  restore("GROQ_API_KEYS", oldGroqKeys);
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
      const chapter = chapters.find((item) => prompt.includes(`Hãy viết chương ${item.title} (`));
      if (!chapter) throw new Error("Unknown chapter prompt");

      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, chapter.key === failedChapter.key ? 5 : 15));
      active -= 1;

      if (chapter.key === failedChapter.key) throw new Error("chapter format exploded");
      return {
        text: completeGeneratedChapter(chapter, `generated-${chapter.key}`),
        model: `mock-${chapter.key}`,
        provider: "deepseek",
      };
    });

    const result = await generateReadingWithProgress(chart, "FULL", "all", (progress) => {
      progressSnapshots.push(progress);
    });
    const promptMeta = JSON.parse(result.prompt);
    const failedChapterMeta = promptMeta.chapters.find((chapter: { key: string }) => chapter.key === failedChapter.key);
    const successfulChapterMeta = promptMeta.chapters.find((chapter: { key: string }) => chapter.key === chapters[0].key);

    expect(maxActive).toBeLessThanOrEqual(3);
    expect(llmRouterMocks.generateWithLlmRouter).toHaveBeenCalledTimes(10);
    expect(result.content).toContain(`generated-${chapters[0].key}`);
    expect(result.content).toContain(`# ${failedChapter.title}`);
    expect(result.content).not.toContain(`generated-${failedChapter.key}`);
    expect(failedChapterMeta).toMatchObject({ key: failedChapter.key, formatGuarded: true });
    expect(String(failedChapterMeta.model)).toContain("template-fallback");
    expect(successfulChapterMeta).toMatchObject({ key: chapters[0].key, formatGuarded: false });
    expect(promptMeta).not.toHaveProperty("modelPolicy");
    expect(progressSnapshots).toHaveLength(9);
    expect(progressSnapshots.at(-1)?.completedChapters).toHaveLength(9);
  });

  it("routes paid chapters through DeepSeek then Groq", async () => {
    clearProviderEnv();
    llmRouterMocks.hasExternalLlmProvider.mockReturnValue(true);

    const chart = sampleChart();
    const chapters = paidReadingChapters(chart, "FULL");
    const weakChapter = chapters.find((chapter) => chapter.key === "money")!;
    const yearlyChapter = chapters.find((chapter) => chapter.key === "yearly-months")!;
    const attemptsByKey = new Map<string, number>();

    llmRouterMocks.generateWithLlmRouter.mockImplementation(async (options: { prompt: string }) => {
      const chapter = chapters.find((item) => options.prompt.includes(`Hãy viết chương ${item.title} (`));
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
      String((options as { prompt: string }).prompt).includes(`Hãy viết chương ${weakChapter.title} (`),
    );
    const yearlyCalls = llmRouterMocks.generateWithLlmRouter.mock.calls.filter(([options]) =>
      String((options as { prompt: string }).prompt).includes(`Hãy viết chương ${yearlyChapter.title} (`),
    );

    expect(weakChapterCalls).toHaveLength(2);
    expect((weakChapterCalls[0][0] as { providerOrder?: string[] }).providerOrder).toEqual(["deepseek", "groq"]);
    expect((weakChapterCalls[1][0] as { providerOrder?: string[] }).providerOrder).toEqual(["deepseek", "groq"]);
    expect(yearlyCalls).toHaveLength(1);
    expect(result.content).toContain(`generated-${weakChapter.key}-attempt-2`);
    expect(weakChapterMeta).toMatchObject({ key: weakChapter.key, model: "groq/llama-3.1-8b-instant", formatGuarded: false });
    expect(promptMeta).not.toHaveProperty("modelPolicy");
  });

  it("asks the free overview LLM for a roughly 1,200-word personal mini-report", async () => {
    clearProviderEnv();

    const chart = sampleChart();
    const { prompt } = await generateFreeOverview(chart);

    expect(prompt).toContain(String(FREE_OVERVIEW_MIN_WORDS));
    expect(prompt).toContain(String(FREE_OVERVIEW_MAX_WORDS));
    expect(FREE_OVERVIEW_MIN_WORDS).toBe(1000);
    expect(FREE_OVERVIEW_MAX_WORDS).toBe(1400);
    expect(FREE_OVERVIEW_MAX_TOKENS).toBeLessThanOrEqual(7000);
    expect(prompt).toContain("1.150-1.250");
    expect(prompt).toContain("## Tín hiệu nổi bật của lá số");
    expect(prompt).toContain("650-900 ký tự");
    expect(prompt).toContain("người đọc thấy đúng");
    expect(prompt).toContain("muốn mở hồ sơ chuyên sâu");
    expect(prompt).toContain("## Mỏ neo");
    expect(prompt).toContain("## Điểm đáng chú ý nhất");
    expect(prompt).toContain("## Khí chất và nội lực");
    expect(prompt).toContain("## Công việc và tài chính");
    expect(prompt).toContain("## Tình cảm và quan hệ");
    expect(prompt).toContain("## Sức khỏe và nhịp sống");
    expect(prompt).toContain(`## Vận năm ${chart.input.viewYear}`);
    expect(prompt).toContain("không dùng điểm số thô");
    expect(prompt).toContain("12-21 tuổi");
    expect(prompt).toContain("tiền tiêu vặt");
    expect(prompt).toContain("bài tập nhóm");
    expect(prompt).toContain("người lớn tuổi");
    expect(prompt).toContain("câu ngắn");
    expect(prompt).toContain("giải thích thuật ngữ ngay bằng lời đời thường");
    expect(prompt).toContain("không dùng giọng học thuật");
    expect(prompt).toContain("## Câu hỏi mở trước khi đi sâu");
    expect(prompt).not.toContain("## Cẩm nang hành động");
    expect(prompt).toContain("Không viết như bài blog");
    expect(prompt).toContain("What/Why");
  });

  it("renders a useful instant free overview before the background LLM finishes", () => {
    const chart = youngSampleChart();
    const content = buildInstantFreeOverview(chart);

    expect(countWords(content)).toBeGreaterThanOrEqual(FREE_OVERVIEW_MIN_WORDS);
    expect(countWords(content)).toBeLessThanOrEqual(FREE_OVERVIEW_MAX_WORDS);
    expect(content).toContain("## Mỏ neo");
    expect(content).toContain("## Tín hiệu nổi bật của lá số");
    const guestTeaser = buildFreeOverviewTeaser(content);
    expect(guestTeaser.length).toBeGreaterThanOrEqual(FREE_OVERVIEW_GUEST_TEASER_MIN_CHARS);
    expect(guestTeaser.length).toBeLessThanOrEqual(FREE_OVERVIEW_GUEST_TEASER_MAX_CHARS);
    expect(guestTeaser).toContain(chart.input.fullName);
    expect(guestTeaser).not.toContain("## Mỏ neo");
    expect(content).toContain("## Điểm đáng chú ý nhất");
    expect(content).toContain("## Khí chất và nội lực");
    expect(content).toContain("## Công việc và tài chính");
    expect(content).toContain("## Tình cảm và quan hệ");
    expect(content).toContain("## Sức khỏe và nhịp sống");
    expect(content).toContain(`## Vận năm ${chart.input.viewYear}`);
    expect(content).toContain("## Câu hỏi mở trước khi đi sâu");
    expect(content).not.toContain("## Cẩm nang hành động");
    expect(content).not.toMatch(/\d+\/100/);
    expect(content).toContain("tiền tiêu vặt");
    expect(content).toContain("part-time");
    expect(content).toContain("bài tập nhóm");
    expect(content).not.toContain("vốn thử nghiệm");
    expect(content).not.toContain("văn bản phạm vi công việc");
    expect(content).not.toContain("dòng tiền");
    expect(content).toContain(chart.input.fullName);
    expect(content).toContain(chart.menh);
    expect(content).toContain(chart.than);
    expect(content).not.toContain(PAID_FULL_WORD_TARGET);
    expect(content).not.toContain("## Luận giải chính");
  });

  it("uses the explicit DeepSeek-to-Groq router for free overview", async () => {
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
        providerOrder: ["deepseek", "groq"],
      }),
    );
  });

  it("generates a short evidence-based LLM preview before the full overview", async () => {
    clearProviderEnv();
    llmRouterMocks.hasExternalLlmProvider.mockReturnValue(true);
    const preview = Array.from(
      { length: 165 },
      (_, index) => index === 0 ? "Cung Mệnh" : `tín-hiệu-${index}`,
    ).join(" ");
    llmRouterMocks.generateWithLlmRouter.mockResolvedValue({
      text: preview,
      model: "deepseek/deepseek-chat",
      provider: "deepseek",
    });

    const result = await generateFreeOverviewPreview(sampleChart());

    expect(FREE_OVERVIEW_PREVIEW_MIN_WORDS).toBe(150);
    expect(FREE_OVERVIEW_PREVIEW_MAX_WORDS).toBe(200);
    expect(result.content).toBe(preview);
    expect(result.model).toBe("deepseek/deepseek-chat");
    expect(result.prompt).toContain("150-200 từ");
    expect(isCompleteFreeOverviewPreview(result.content)).toBe(true);
    expect(isCompleteFreeOverviewPreview("Một đoạn quá ngắn không có dữ liệu lá số.")).toBe(false);
    expect(llmRouterMocks.generateWithLlmRouter).toHaveBeenCalledWith(
      expect.objectContaining({
        maxTokens: expect.any(Number),
        providerOrder: ["deepseek", "groq"],
      }),
    );
  });

  it("accepts only evidence-based mini-reports within the guard range", () => {
    const buildContent = (fillerWords: number) => {
      const filler = Array.from({ length: fillerWords }, (_, index) => `dữ-liệu-${index}`).join(" ");
      return `## Tín hiệu nổi bật của lá số
Với cung Mệnh có Tử Vi, lá số này không đi theo kiểu may rủi nhất thời mà nghiêng về năng lực dựng khung, nhìn vấn đề và giữ nhịp khi xung quanh bắt đầu rối. Điểm khiến người đọc dễ thấy đúng là bên ngoài có thể khá điềm, nhưng bên trong lại thường tự tính rất nhiều đường trước khi quyết. Trục Quan Lộc và Tài Bạch cho thấy cơ hội không thiếu, nhưng chỉ mở ra giá trị thật khi phạm vi, quyền hạn và dòng tiền được nói rõ từ đầu. Nếu muốn biết nên chọn cơ hội nào, tránh điểm nghẽn nào và năm 2026 nên đi nhanh hay đi chắc, phần hồ sơ chuyên sâu sẽ nối các cung, sao và đại vận thành một bản định hướng cụ thể hơn.

## Mỏ neo
- **Năng lượng nội lực: nền ổn định** — Cung Mệnh có Tử Vi.
- **Nhịp công việc & tài chính: chọn lọc trước khi nhận** — Cung Quan Lộc cần chủ động.
- **Tín hiệu năm 2026: tiến từng bước có kiểm chứng** — Đại vận nhắc giữ nhịp.

## Điểm đáng chú ý nhất
Cung Mệnh có Tử Vi và đại vận hiện tại tạo ra một điểm chuyển. ${filler}

## Khí chất và nội lực
Mệnh và Thân cho thấy khả năng tổ chức.

## Công việc và tài chính
Cung Quan Lộc và Tài Bạch cần được đối chiếu trước quyết định.

## Tình cảm và quan hệ
Cung Phu Thê nhắc giữ ranh giới rõ ràng.

## Sức khỏe và nhịp sống
Cung Tật Ách chỉ dùng để nhắc nhịp nghỉ ngơi, không thay thế tư vấn y khoa.

## Vận năm 2026
Tuần tại Thiên Di là tín hiệu nên kiểm chứng.

## Câu hỏi mở trước khi đi sâu
- Năm 2026, đâu là lựa chọn cần đọc sâu trước khi quyết?
- Cơ hội nào đang mở ra thật, và cơ hội nào chỉ tạo áp lực?
- Vì sao cùng một mối quan hệ có lúc hỗ trợ, có lúc làm hao sức?
- Điểm nghẽn nào cần đối chiếu với đại vận trước khi hành động?`;
    };
    const content = buildContent(1020);

    expect(isCompleteFreeOverview(content)).toBe(true);
    expect(isCompleteFreeOverview(content.replace("## Tín hiệu nổi bật của lá số", "## Gợi mở"))).toBe(false);
    expect(isCompleteFreeOverview(content.replace("## Tình cảm và quan hệ", "## Ghi chú"))).toBe(false);
    expect(isCompleteFreeOverview(buildContent(500))).toBe(false);
    expect(isCompleteFreeOverview(buildContent(1450))).toBe(false);
  });

  it("defines eight interpretive chapters and one consolidated action chapter", () => {
    const chart = sampleChart();
    const chapters = paidReadingChapters(chart, "FULL");

    expect(chapters).toHaveLength(9);
    expect(chapters.map((chapter) => chapter.title)).toEqual([
      "Chương 1: Tổng quan lá số",
      "Chương 2: Mệnh, Thân và khí chất cốt lõi",
      "Chương 3: 12 cung trọng yếu",
      "Chương 4: Công việc và định hướng sự nghiệp",
      "Chương 5: Tài chính và cách quản trị tiền bạc",
      "Chương 6: Tình cảm, hôn nhân, gia đình",
      "Chương 7: Sức khỏe, tinh thần, nhịp sống",
      "Chương 8: Vận hạn năm 2026 và gợi ý theo từng tháng",
      "Chương 9: Kế hoạch hành động cá nhân",
    ]);
    expect(chapters.some((chapter) => chapter.requiredSections.includes("Dữ kiện lá số đã dùng"))).toBe(false);
    expect(chapters.some((chapter) => chapter.requiredSections.includes("Cơ sở tử vi cần nắm"))).toBe(false);
    expect(chapters.slice(0, 8).every((chapter) => chapter.requiredSections.join("|") === "Mỏ neo|Luận giải chi tiết")).toBe(true);
    expect(chapters[8]).toMatchObject({
      key: "action-plan",
      requiredSections: [
        "Việc cần ưu tiên ngay",
        "Kế hoạch 30 ngày",
        "Kế hoạch 90 ngày",
        "Điều cần tránh",
        "Mốc tự đánh giá lại",
      ],
    });
    expect(PAID_FULL_WORD_TARGET).toBe("5.000-7.000 từ");
    expect(chapters.find((chapter) => chapter.key === "relationship")?.targetWords).toBe("450-700 từ");
    expect(chapters.find((chapter) => chapter.key === "health")?.targetWords).toBe("400-650 từ");
    const upperTargets = chapters.map((chapter) => Number(chapter.targetWords.match(/-(\d[\d.]*)/)?.[1].replace(/\./g, "") || 0));
    expect(Math.max(...upperTargets)).toBeLessThanOrEqual(1300);
  });

  it("keeps evidence in prose and removes the technical data dashboard", async () => {
    clearProviderEnv();

    const chart = sampleChart();
    const chapters = paidReadingChapters(chart, "FULL");
    const prompt = paidReadingChapterPrompt(
      chart,
      "FULL",
      "all",
      { title: "Luận giải toàn bộ", evidence: ["Mệnh: Sơn đầu Hỏa", "Lưu niên: L.Kình Dương (H)"] },
      chapters[0],
      0,
      chapters.length,
    );

    const { content } = await generateReading(chart, "FULL", "all");

    expect(prompt).not.toContain("Trung tâm dữ liệu lá số");
    expect(prompt).toContain("Mỏ neo - Độ sâu");
    expect(prompt).toContain("không tạo section dữ kiện");
    expect(prompt).toContain("không lặp lại cùng một nhận định");
    expect(prompt).toContain("2-4");
    expect(prompt).toContain("**");
    expect(prompt).not.toContain("Dữ kiện các cung trọng yếu:");

    expect(content.match(/## Dữ kiện lá số đã dùng/g)).toBeNull();
    expect(content).not.toContain("# Trung tâm dữ liệu lá số");
    expect(content).not.toContain("## Cẩm nang hành động");
  });

  it("builds a bounded action context from prior anchors and bold conclusions", () => {
    const context = buildPaidActionPlanContext([
      "# Chương 1\n## Mỏ neo\n**Nội lực bền bỉ.**\n## Luận giải chi tiết\nBỏ qua đoạn dài.",
      "# Chương 2\n## Mỏ neo\nĐiểm neo thứ hai.\n## Luận giải chi tiết\n**Kiểm tra dữ kiện trước quyết định.**",
    ]);

    expect(context).toContain("Chương 1");
    expect(context).toContain("Nội lực bền bỉ");
    expect(context).toContain("Chương 2");
    expect(context).toContain("Kiểm tra dữ kiện trước quyết định");
    expect(context).not.toContain("Bỏ qua đoạn dài");
    expect(context.length).toBeLessThanOrEqual(12_000);
  });

  it("formats strategic full chapters as life pillars and yearly timeline cards", () => {
    const chart = sampleChart("male");
    const chapters = paidReadingChapters(chart, "FULL");
    const twelvePalacesChapter = chapters.find((chapter) => chapter.key === "twelve-palaces")!;
    const yearlyChapter = chapters.find((chapter) => chapter.key === "yearly-months")!;

    const twelvePalacesPrompt = paidReadingChapterPrompt(
      chart,
      "FULL",
      "all",
      { title: "Luận giải toàn bộ", evidence: ["Mệnh: Thiên Đồng (H)", "Tài Bạch: Vô chính diệu"] },
      twelvePalacesChapter,
      2,
      chapters.length,
    );
    const yearlyPrompt = paidReadingChapterPrompt(
      chart,
      "FULL",
      "all",
      { title: "Luận giải toàn bộ", evidence: ["Vận năm: L.Kình Dương", "Đại vận: Quan Lộc"] },
      yearlyChapter,
      7,
      chapters.length,
    );

    expect(twelvePalacesPrompt).toContain("### Trụ cột 1: Bản Thể & Sức Khỏe");
    expect(twelvePalacesPrompt).toContain("### Trụ cột 2: Sự Nghiệp & Thịnh Vượng");
    expect(twelvePalacesPrompt).toContain("### Trụ cột 3: Mạng Lưới Mối Quan Hệ");
    expect(yearlyPrompt).toContain("nhịp từng tháng");
    expect(yearlyPrompt).toContain("🔻 Điểm cần chậm lại");
    expect(yearlyPrompt).toContain("🔹 Việc nên tận dụng");
  });

  it("builds paid prompts with word target, address, star states and yearly-star requirements", () => {
    const chart = sampleChart("male");
    const chapters = paidReadingChapters(chart, "FULL");
    const yearlyChapter = chapters.find((chapter) => chapter.key === "yearly-months");
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
    const yearlyChapter = chapters.find((chapter) => chapter.key === "yearly-months")!;
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

  it("guides paid readings toward simple older-reader language and concrete value", () => {
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

    expect(prompt).toContain("người lớn tuổi");
    expect(prompt).toContain("câu ngắn");
    expect(prompt).toContain("tình huống cụ thể");
    expect(prompt).toContain("mỗi thuật ngữ tử vi phải được giải thích ngay bằng lời đời thường");
    expect(prompt).toContain("tránh từ chuyên môn khi không cần");
    expect(prompt).toContain("đọc xong hiểu ngay mình nên chú ý điều gì");
    expect(prompt).not.toContain("Tránh hiệu ứng Barnum");
    expect(prompt).not.toContain("Actionable Advice");
    expect(prompt).not.toContain("vũ khí");
    expect(prompt).not.toContain("cạm bẫy");
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
    expect(prompt).toContain("người lớn tuổi");
    expect(prompt).toContain("câu ngắn");
    expect(prompt).toContain("tình huống cụ thể");
    expect(prompt).toContain("mỗi thuật ngữ tử vi phải được giải thích ngay bằng lời đời thường");
    expect(prompt).toContain("đọc xong hiểu ngay mình nên chú ý điều gì");
    expect(prompt).toContain("Mệnh");
    expect(prompt).toContain("Thân");
  });

  it("sizes token budgets to each full chapter instead of over-allocating every chapter", () => {
    const chart = sampleChart();
    const fullChapters = paidReadingChapters(chart, "FULL");
    const overviewChapter = fullChapters[0];
    const fullYearChapter = paidReadingChapters(chart, "FULL").find((chapter) => chapter.key === "yearly-months")!;
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

  it("returns a structured 9-chapter fallback when no LLM provider is configured", async () => {
    clearProviderEnv();

    const { content, prompt, model } = await generateReading(sampleChart(), "FULL", "all");
    const chapters = paidReadingChapters(sampleChart(), "FULL");

    expect(model).toBe("template-fallback");
    for (const chapter of chapters) {
      expect(content).toContain(`# ${chapter.title}`);
    }
    expect(content).toContain("## Mỏ neo");
    expect(content).toContain("## Luận giải chi tiết");
    expect(content).not.toContain("## Cẩm nang hành động");
    expect(content).not.toContain("# Trung tâm dữ liệu lá số");
    expect(content).toContain("# Chương 9: Kế hoạch hành động cá nhân");
    expect(content).toContain("## Kế hoạch 30 ngày");
    expect(content).toContain("Gợi ý 12 tháng");
    expect(content).not.toContain("Chương này được dựng từ dữ liệu lá số");
    expect(content).not.toContain("Dữ kiện trọng yếu");

    const monthBodies = Array.from(content.matchAll(/^### Tháng \d+:\s*(.+)$/gm), (match) => match[1]);
    expect(monthBodies).toHaveLength(12);
    expect(new Set(monthBodies).size).toBe(12);
    expect(content.match(/🔻 Điểm cần chậm lại/g)).toHaveLength(12);
    expect(content.match(/🔹 Việc nên tận dụng/g)).toHaveLength(12);
    expect(prompt).toContain("paid-personal-dossier-v5");
  });

  it("computes 5 directional score groups for the advanced report header", () => {
    const summary = getDeepReadingSummary(sampleChart());

    expect(summary.scores).toHaveLength(5);
    expect(summary.scores.map((score) => score.label)).toEqual(["Công việc", "Tài chính", "Tình cảm", "Sức khỏe", "Vận năm"]);
    expect(summary.scores.every((score) => score.value >= 35 && score.value <= 92)).toBe(true);
  });
});
