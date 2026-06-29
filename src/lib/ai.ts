import { type TuViChart } from "@/lib/chart";
import { buildChartEvidenceProfile, formatChartEvidence } from "@/lib/chart-evidence";
import { generateWithLlmRouter, hasExternalLlmProvider } from "@/lib/llm-router";
import { FEATURE_PRICES, type ReadingKey } from "@/lib/pricing";

export const FREE_OVERVIEW_MIN_WORDS = 400;
export const FREE_OVERVIEW_MAX_WORDS = 650;
export const FREE_OVERVIEW_MAX_TOKENS = 4500;
export const PAID_READING_CHAPTER_MAX_TOKENS = 7000;
export const FREE_OVERVIEW_VERSION = "free-mini-report-v4";
export const PAID_READING_VERSION = "paid-personal-dossier-v4";
export const PAID_FULL_WORD_TARGET = "8.000-12.000 từ";
export const READING_PROVIDER_ORDER = ["deepseek", "groq"] as const;
const PAID_READING_DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const PAID_READING_DEFAULT_ESCALATION_GEMINI_MODEL = "gemini-3.5-flash";

const IMPORTANT_PALACES = ["Mệnh", "Thân", "Quan Lộc", "Tài Bạch", "Phu Thê", "Tật Ách", "Thiên Di"];
const GOOD_STAR_HINTS = ["Lộc", "Khoa", "Quyền", "Tả", "Hữu", "Xương", "Khúc", "Khôi", "Việt", "Thiên Mã", "Long Trì", "Phượng"];
const RISK_STAR_HINTS = ["Kình", "Đà", "Không", "Kiếp", "Hỏa", "Linh", "Tang", "Hổ", "Khốc", "Hư", "Riêu", "Kỵ", "Thiên La", "Địa Võng"];

type DeepScoreKey = "career" | "money" | "love" | "health" | "year";

export type DeepReadingScore = {
  key: DeepScoreKey;
  label: string;
  value: number;
};

export type PaidReadingChapter = {
  key: string;
  title: string;
  requiredSections: string[];
  instruction: string;
  targetWords: string;
};

function isLlmDisabledForSmoke() {
  return process.env.PLAYWRIGHT_DISABLE_LLM === "1";
}

export function countWords(content: string) {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

export async function runReadingChapterTasks<TInput, TOutput>(
  items: TInput[],
  limit: number,
  worker: (item: TInput, index: number) => Promise<TOutput>,
) {
  if (items.length === 0) return [] as TOutput[];
  const concurrency = Math.max(1, Math.min(items.length, Math.floor(limit) || 1));
  const results = new Array<TOutput>(items.length);
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (nextIndex < items.length) {
        const index = nextIndex;
        nextIndex += 1;
        results[index] = await worker(items[index], index);
      }
    }),
  );

  return results;
}

function normalizedText(content: string) {
  return content
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function paidChapterMinimumWords(chapter: PaidReadingChapter) {
  const lowerTarget = Number(chapter.targetWords.replace(/\./g, "").match(/\d+/)?.[0] || 650);
  return Math.min(650, Math.max(360, Math.floor(lowerTarget * 0.55)));
}

export function isCompletePaidChapter(content: string, chapter: PaidReadingChapter) {
  const trimmed = content.trim();
  if (!trimmed) return false;

  const hasStartLine = chapter.key === "focused-reading" ? /^#\s+\S/.test(trimmed) : trimmed.includes(`# ${chapter.title}`);
  const hasRequiredSections = chapter.requiredSections.every((section) => trimmed.includes(`## ${section}`));
  const hasEnoughWords = countWords(trimmed) >= paidChapterMinimumWords(chapter);
  const actionBulletCount = (trimmed.match(/^\s*[-*]\s+\S/gm) || []).length;
  const hasEnoughActionBullets = actionBulletCount >= 3;
  const hasYearlyMonths =
    chapter.key !== "yearly-months" ||
    Array.from({ length: 12 }, (_, index) => `thang ${index + 1}`).every((month) => normalizedText(trimmed).includes(month));

  return hasStartLine && hasRequiredSections && hasEnoughWords && hasEnoughActionBullets && hasYearlyMonths;
}

export function isCompleteFreeOverview(content: string) {
  const requiredHeadings = [
    "## Chân dung nổi bật",
    "## Điểm mạnh nên phát huy",
    "## Cơ hội công việc và tài chính",
    "## Điều cần thận trọng",
    "## Gợi ý hành động trong năm",
  ];
  const wordCount = countWords(content);
  const hasChartEvidence = /(cung|mệnh|thân|sao|đại vận|tuần|triệt)/i.test(content);

  return (
    wordCount >= FREE_OVERVIEW_MIN_WORDS &&
    wordCount <= FREE_OVERVIEW_MAX_WORDS &&
    hasChartEvidence &&
    requiredHeadings.every((heading) => content.includes(heading))
  );
}

function clampScore(value: number) {
  return Math.max(35, Math.min(92, Math.round(value)));
}

function chartAge(chart: TuViChart) {
  return chart.input.viewYear - chart.solar.year;
}

function viewerAddress(chart: TuViChart) {
  const age = chartAge(chart);
  if (age >= 55) return chart.input.gender === "female" ? "cô" : "chú";
  if (age >= 35) return chart.input.gender === "female" ? "chị" : "anh";
  return "bạn";
}

function palaceByName(chart: TuViChart, name: string) {
  if (name === "Thân") {
    const thanName = chart.than?.replace("Thân cư ", "");
    return chart.palaces.find((item) => item.name === thanName);
  }
  return chart.palaces.find((item) => item.name === name);
}

function starsWithStates(chart: TuViChart, stars: string[], palaceName: string, fallback: string) {
  const palace = chart.palaces.find((item) => item.name === palaceName);
  if (!stars.length) return fallback;
  return stars
    .map((star) => {
      const state = palace?.starStates?.[star];
      return state ? `${star} (${state})` : star;
    })
    .join(", ");
}

function starSignalScore(chart: TuViChart, palaceNames: string[]) {
  let score = 64;
  for (const name of palaceNames) {
    const palace = palaceByName(chart, name);
    if (!palace) continue;
    const stars = [...palace.mainStars, ...palace.supportStars, ...palace.yearlyStars];
    for (const star of stars) {
      const state = palace.starStates?.[star];
      if (state === "M") score += 7;
      if (state === "V") score += 6;
      if (state === "Đ") score += 5;
      if (state === "H") score -= 8;
      if (GOOD_STAR_HINTS.some((hint) => star.includes(hint))) score += 2;
      if (RISK_STAR_HINTS.some((hint) => star.includes(hint))) score -= 3;
      if (star.startsWith("L.") && RISK_STAR_HINTS.some((hint) => star.includes(hint))) score -= 2;
      if (star.startsWith("L.") && GOOD_STAR_HINTS.some((hint) => star.includes(hint))) score += 2;
    }
  }
  return clampScore(score);
}

export function getDeepReadingScores(chart: TuViChart): DeepReadingScore[] {
  return [
    { key: "career", label: "Công việc", value: starSignalScore(chart, ["Mệnh", "Thân", "Quan Lộc", "Thiên Di"]) },
    { key: "money", label: "Tài chính", value: starSignalScore(chart, ["Tài Bạch", "Quan Lộc", "Phúc Đức"]) },
    { key: "love", label: "Tình cảm", value: starSignalScore(chart, ["Phu Thê", "Phụ Mẫu", "Huynh Đệ", "Tử Tức"]) },
    { key: "health", label: "Sức khỏe", value: starSignalScore(chart, ["Tật Ách", "Mệnh", "Thân"]) },
    { key: "year", label: "Vận năm", value: starSignalScore(chart, IMPORTANT_PALACES) },
  ];
}

export function getDeepReadingSummary(chart: TuViChart) {
  return {
    version: PAID_READING_VERSION,
    wordTarget: PAID_FULL_WORD_TARGET,
    viewerAddress: viewerAddress(chart),
    age: chartAge(chart),
    viewYear: chart.input.viewYear,
    scores: getDeepReadingScores(chart),
  };
}

export type PaidReadingChapterOutput = {
  key: string;
  title: string;
  content: string;
  model: string;
  prompt: string;
  wordCount: number;
  maxTokens: number;
  formatGuarded: boolean;
};

export type PaidReadingGenerationProgress = {
  chapter: PaidReadingChapterOutput;
  completedChapters: PaidReadingChapterOutput[];
  totalChapters: number;
};

function paidReadingConcurrencyLimit(type: ReadingKey) {
  if (type !== "FULL") return 1;
  const configured = Number(process.env.PAID_READING_CHAPTER_CONCURRENCY || 3);
  return Math.max(1, Math.min(3, Number.isFinite(configured) ? Math.floor(configured) : 3));
}

function paidReadingPrimaryGeminiModel() {
  return process.env.PAID_READING_PRIMARY_GEMINI_MODEL || PAID_READING_DEFAULT_GEMINI_MODEL;
}

function paidReadingEscalationGeminiModel() {
  return process.env.PAID_READING_ESCALATION_GEMINI_MODEL || PAID_READING_DEFAULT_ESCALATION_GEMINI_MODEL;
}

function paidReadingYearlyGeminiModel() {
  return process.env.PAID_READING_YEARLY_GEMINI_MODEL || paidReadingEscalationGeminiModel();
}

function paidReadingInitialGeminiModel(chapter: PaidReadingChapter) {
  return chapter.key === "yearly-months" ? paidReadingYearlyGeminiModel() : paidReadingPrimaryGeminiModel();
}

function paidReadingPromptMeta(
  chart: TuViChart,
  type: ReadingKey,
  summary: ReturnType<typeof getDeepReadingSummary>,
  outputs: PaidReadingChapterOutput[],
  fallbackReason?: string,
) {
  return {
    strategy: PAID_READING_VERSION,
    promptVersion: PAID_READING_VERSION,
    ...(fallbackReason ? { fallback: true, reason: fallbackReason } : {}),
    wordTarget: type === "FULL" ? PAID_FULL_WORD_TARGET : "theo phạm vi mở khóa",
    maxTokensPerChapter: PAID_READING_CHAPTER_MAX_TOKENS,
    concurrency: paidReadingConcurrencyLimit(type),
    providerOrder: READING_PROVIDER_ORDER.join(","),
    modelPolicy: {
      primaryGeminiModel: paidReadingPrimaryGeminiModel(),
      escalationGeminiModel: paidReadingEscalationGeminiModel(),
      yearlyGeminiModel: paidReadingYearlyGeminiModel(),
    },
    chartEngineVersion: chart.engine?.version,
    chartEngineProfile: chart.engine?.starProfile,
    viewYear: chart.input.viewYear,
    viewerAddress: summary.viewerAddress,
    age: summary.age,
    scores: summary.scores,
    chapters: outputs.map((chapter) => ({
      key: chapter.key,
      title: chapter.title,
      model: chapter.model,
      wordCount: chapter.wordCount,
      maxTokens: chapter.maxTokens,
      formatGuarded: chapter.formatGuarded,
      prompt: chapter.prompt,
    })),
  };
}

export async function generateReadingWithProgress(
  chart: TuViChart,
  type: ReadingKey,
  scopeKey: string,
  onProgress?: (progress: PaidReadingGenerationProgress) => Promise<void> | void,
) {
  const focus = getFocusData(chart, type, scopeKey);
  const chapters = paidReadingChapters(chart, type);
  const summary = getDeepReadingSummary(chart);
  const completedByIndex = new Array<PaidReadingChapterOutput | undefined>(chapters.length);

  const emitProgress = async (index: number, chapter: PaidReadingChapterOutput) => {
    completedByIndex[index] = chapter;
    await onProgress?.({
      chapter,
      completedChapters: completedByIndex.filter(Boolean) as PaidReadingChapterOutput[],
      totalChapters: chapters.length,
    });
  };

  if (isLlmDisabledForSmoke() || !hasExternalLlmProvider()) {
    const outputs: PaidReadingChapterOutput[] = [];
    for (const [index, chapter] of chapters.entries()) {
      const prompt = paidReadingChapterPrompt(chart, type, scopeKey, focus, chapter, index, chapters.length);
      const maxTokens = paidReadingMaxTokens(type, chapter);
      const content = fallbackChapterBody(chart, chapter, focus);
      const output = {
        key: chapter.key,
        title: chapter.title,
        content,
        model: "template-fallback",
        prompt,
        wordCount: countWords(content),
        maxTokens,
        formatGuarded: false,
      };
      outputs.push(output);
      await emitProgress(index, output);
    }

    return {
      content: outputs.map((chapter) => chapter.content.trim()).join("\n\n"),
      model: "template-fallback",
      prompt: JSON.stringify(paidReadingPromptMeta(chart, type, summary, outputs, "no-provider")),
    };
  }

  const outputs = await runReadingChapterTasks(chapters, paidReadingConcurrencyLimit(type), async (chapter, index) => {
    const prompt = paidReadingChapterPrompt(chart, type, scopeKey, focus, chapter, index, chapters.length);
    const maxTokens = paidReadingMaxTokens(type, chapter);
    const initialGeminiModel = paidReadingInitialGeminiModel(chapter);
    const escalationGeminiModel = paidReadingEscalationGeminiModel();
    let generated: Awaited<ReturnType<typeof generatePaidChapter>> = null;
    let chapterError: string | null = null;
    try {
      generated = await generatePaidChapter(prompt, maxTokens, initialGeminiModel);
    } catch (error) {
      chapterError = error instanceof Error ? error.message : String(error);
    }
    let generatedContent = generated?.content?.trim() || "";
    let hasCompleteContent = generatedContent ? isCompletePaidChapter(generatedContent, chapter) : false;

    if (!hasCompleteContent && initialGeminiModel !== escalationGeminiModel) {
      try {
        const escalated = await generatePaidChapter(prompt, maxTokens, escalationGeminiModel);
        const escalatedContent = escalated?.content?.trim() || "";
        if (escalatedContent) {
          generated = escalated;
          generatedContent = escalatedContent;
          hasCompleteContent = isCompletePaidChapter(escalatedContent, chapter);
        }
      } catch (error) {
        chapterError = error instanceof Error ? error.message : String(error);
      }
    }

    const content = hasCompleteContent ? generatedContent : fallbackChapterBody(chart, chapter, focus);
    const output = {
      key: chapter.key,
      title: chapter.title,
      content,
      model: hasCompleteContent
        ? generated!.model
        : generatedContent
          ? `${generated!.model} + format-guard`
          : chapterError
            ? "template-fallback + error-guard"
            : "template-fallback",
      prompt,
      wordCount: countWords(content),
      maxTokens,
      formatGuarded: !hasCompleteContent,
    };
    await emitProgress(index, output);
    return output;
  });

  return {
    content: outputs.map((chapter) => chapter.content.trim()).join("\n\n"),
    model: Array.from(new Set(outputs.map((chapter) => chapter.model))).join(" + "),
    prompt: JSON.stringify(paidReadingPromptMeta(chart, type, summary, outputs)),
  };
}

export async function generateReading(chart: TuViChart, type: ReadingKey, scopeKey: string) {
  return generateReadingWithProgress(chart, type, scopeKey);
}

function compactStars(chart: TuViChart, palaceName: string, stars: string[], fallback: string, limit = 10) {
  if (!stars.length) return fallback;
  const palace = chart.palaces.find((item) => item.name === palaceName);
  const visible = stars.slice(0, limit).map((star) => {
    const state = palace?.starStates?.[star];
    return state ? `${star} (${state})` : star;
  });
  const remaining = stars.length - visible.length;
  return remaining > 0 ? `${visible.join(", ")} + ${remaining} sao khác` : visible.join(", ");
}

function compactPalaceContext(chart: TuViChart) {
  return chart.palaces
    .map((palace) => {
      const labels = [palace.isMenh ? "Mệnh" : "", palace.isThan ? "Thân" : ""].filter(Boolean).join(", ");
      return [
        `${palace.name}${labels ? ` [${labels}]` : ""} tại ${palace.branch}`,
        `đại vận ${palace.ageRange}`,
        `trường sinh ${palace.lifecycle}`,
        `chính tinh: ${compactStars(chart, palace.name, palace.mainStars, "vô chính diệu", 4)}`,
        `phụ tinh: ${compactStars(chart, palace.name, palace.supportStars, "không nổi bật", 9)}`,
        `sao lưu năm: ${compactStars(chart, palace.name, palace.yearlyStars, "không nổi bật", 7)}`,
      ].join("; ");
    })
    .join("\n");
}

function compactImportantPalaces(chart: TuViChart) {
  return IMPORTANT_PALACES.map((name) => {
    const palace = palaceByName(chart, name);
    if (!palace) return `${name}: chưa xác định`;
    return `${name}: cung ${palace.name} tại ${palace.branch}; chính tinh ${compactStars(chart, palace.name, palace.mainStars, "vô chính diệu", 5)}; phụ tinh ${compactStars(chart, palace.name, palace.supportStars, "không nổi bật", 8)}; sao lưu ${compactStars(chart, palace.name, palace.yearlyStars, "không nổi bật", 7)}; vòng ${palace.lifecycle}`;
  }).join("\n");
}

function compactDecadeContext(chart: TuViChart) {
  const currentAge = chartAge(chart);
  const current = chart.daiVan.find((period) => {
    const [start, end] = period.range.split("-").map(Number);
    return currentAge >= start && currentAge <= end;
  });
  const allPeriods = chart.daiVan.map((period) => `${period.range} tuổi: ${period.palace} (${period.branch})`).join("; ");
  return {
    currentAge,
    current: current ? `${current.range} tuổi tại cung ${current.palace} (${current.branch})` : "không xác định",
    allPeriods,
  };
}

function focusedPalaceNames(chart: TuViChart, type: ReadingKey, scopeKey: string) {
  const names = new Set<string>(["Mệnh"]);
  const thanName = chart.than?.replace("Thân cư ", "");
  if (thanName) names.add(thanName);

  const focusPalace = chart.palaces.find((item) => item.name === scopeKey || item.branch === scopeKey);
  if (focusPalace) names.add(focusPalace.name);

  const majorPeriod = chart.daiVan.find((period) => period.range === scopeKey);
  if (majorPeriod) names.add(majorPeriod.palace);

  if (type === "PALACE") {
    ["Quan Lộc", "Tài Bạch", "Phu Thê", "Tật Ách", "Thiên Di"].forEach((name) => names.add(name));
  }
  if (type === "DAI_VAN" || type === "TIEU_VAN") {
    ["Quan Lộc", "Tài Bạch", "Phúc Đức", "Tật Ách", "Thiên Di"].forEach((name) => names.add(name));
  }
  if (type === "NGUYET_VAN" || type === "NHAT_VAN") {
    ["Quan Lộc", "Tài Bạch", "Phu Thê", "Tật Ách"].forEach((name) => names.add(name));
  }

  return Array.from(names).filter(Boolean).slice(0, 8);
}

function compactFocusedPalaceContext(chart: TuViChart, type: ReadingKey, scopeKey: string) {
  return focusedPalaceNames(chart, type, scopeKey)
    .map((name) => {
      const palace = palaceByName(chart, name);
      if (!palace) return `${name}: chưa xác định`;
      const labels = [palace.isMenh ? "Mệnh" : "", palace.isThan ? "Thân" : ""].filter(Boolean).join(", ");
      return [
        `${name}: cung ${palace.name}${labels ? ` [${labels}]` : ""} tại ${palace.branch}`,
        `đại vận ${palace.ageRange}`,
        `vòng ${palace.lifecycle}`,
        `chính tinh ${compactStars(chart, palace.name, palace.mainStars, "vô chính diệu", 5)}`,
        `phụ tinh nổi bật ${compactStars(chart, palace.name, palace.supportStars, "không nổi bật", 7)}`,
        `sao lưu ${compactStars(chart, palace.name, palace.yearlyStars, "không nổi bật", 5)}`,
      ].join("; ");
    })
    .join("\n");
}

function compactFocusedChartContext(chart: TuViChart, type: ReadingKey, scopeKey: string, focus: ReturnType<typeof getFocusData>) {
  const decade = compactDecadeContext(chart);
  return `Dữ liệu trọng tâm đã rút gọn:
- Người xem: ${chart.input.fullName}; giới tính: ${chart.input.gender === "female" ? "Nữ" : "Nam"}; năm xem: ${chart.input.viewYear}; tuổi xem: ${decade.currentAge}.
- Dương lịch: ${chart.solar.day}/${chart.solar.month}/${chart.solar.year}; âm lịch: ${chart.lunar.day}/${chart.lunar.month}/${chart.lunar.year}; Can chi: ${chart.canChi.year} / ${chart.canChi.month} / ${chart.canChi.day} / ${chart.canChi.hour}.
- Mệnh/Thân/Cục: ${chart.menh} / ${chart.than} / ${chart.cuc}; bản mệnh: ${chart.banMenh}; âm dương: ${chart.amDuong}; đại vận hiện tại: ${decade.current}.
- Trọng tâm mở khóa: ${focus.title}.
- Bằng chứng bắt buộc phải dùng:
  - ${focus.evidence.join("\n  - ")}

Cung liên quan cần đối chiếu:
${compactFocusedPalaceContext(chart, type, scopeKey)}

Tóm tắt engine:
- ${chart.summary.join("\n- ")}`;
}

function paidReadingDataContext(chart: TuViChart, type: ReadingKey, scopeKey: string, focus: ReturnType<typeof getFocusData>) {
  if (type !== "FULL") return compactFocusedChartContext(chart, type, scopeKey, focus);

  return `Dữ kiện các cung trọng yếu:
${compactImportantPalaces(chart)}

Dữ liệu 12 cung đã an sao, chỉ dùng để chọn bằng chứng mạnh:
${compactPalaceContext(chart)}`;
}

const MONTH_READING_THEMES = [
  "khởi động kế hoạch và kiểm tra nền tảng",
  "dòng tiền, cam kết và nhịp chi tiêu",
  "quan hệ hợp tác, giao tiếp và gia đình",
  "hồ sơ, nhà cửa hoặc việc cần sắp xếp lại",
  "công việc, vai trò và sức bền khi chịu áp lực",
  "đi lại, gặp người ngoài và cách mở rộng quan hệ",
  "sức khỏe tinh thần, giấc ngủ và nhịp nghỉ",
  "tích lũy, đầu tư nhỏ và kiểm soát rủi ro tiền bạc",
  "học hỏi, truyền thông và xử lý hiểu nhầm",
  "trách nhiệm gia đình, việc hậu trường và cảm giác an toàn",
  "đánh giá thành quả, quan hệ cấp trên hoặc khách hàng",
  "tổng kết năm, thu gọn việc dở và chuẩn bị chu kỳ mới",
];

function compactPalaceSignalsForMonth(chart: TuViChart, palaceName: string) {
  const palace = palaceByName(chart, palaceName);
  if (!palace) return "dữ kiện cung đang cập nhật";
  const stars = [...palace.yearlyStars, ...palace.mainStars, ...palace.supportStars]
    .slice(0, 5)
    .map((star) => {
      const state = palace.starStates?.[star];
      return state ? `${star} (${state})` : star;
    });
  return stars.length ? stars.join(", ") : `vòng ${palace.lifecycle}`;
}

function yearlyMonthGuidanceLines(chart: TuViChart) {
  const anchor = (chart.lunar.month + chart.input.viewYear) % chart.palaces.length;
  return Array.from({ length: 12 }, (_, monthIndex) => {
    const month = monthIndex + 1;
    const palace = chart.palaces[(anchor + monthIndex) % chart.palaces.length];
    const nextPalace = chart.palaces[(anchor + monthIndex + 1) % chart.palaces.length];
    const theme = MONTH_READING_THEMES[monthIndex];
    const signals = compactPalaceSignalsForMonth(chart, palace.name);
    const caution = nextPalace ? `${nextPalace.name.toLowerCase()} và các cam kết kéo theo` : "việc phát sinh ngoài kế hoạch";
    return `- Tháng ${month}: Cung tham chiếu ${palace.name} (${palace.branch}), tín hiệu ${signals}; trọng tâm là ${theme}; nên ưu tiên một việc có mốc kiểm tra rõ, tránh mở rộng sang ${caution} khi thông tin chưa đủ chắc.`;
  });
}

function yearlyMonthContextBlock(chart: TuViChart) {
  return `Bảng ngữ cảnh 12 tháng (mỗi tháng phải có trọng tâm riêng, không lặp mẫu 1/4/7/10):
${yearlyMonthGuidanceLines(chart).join("\n")}`;
}

function fallbackEvidenceForChapter(chart: TuViChart, chapter: PaidReadingChapter, fallbackEvidence: string) {
  const palaceNamesByChapter: Record<string, string[]> = {
    overview: ["Mệnh", "Thân", "Quan Lộc", "Tài Bạch"],
    "menh-than": ["Mệnh", "Thân", "Quan Lộc"],
    "twelve-palaces": ["Mệnh", "Quan Lộc", "Tài Bạch", "Phu Thê", "Tật Ách"],
    career: ["Quan Lộc", "Thiên Di", "Nô Bộc"],
    money: ["Tài Bạch", "Điền Trạch", "Quan Lộc"],
    relationship: ["Phu Thê", "Phúc Đức", "Huynh Đệ"],
    health: ["Tật Ách", "Mệnh", "Thiên Di"],
    "yearly-months": ["Quan Lộc", "Tài Bạch", "Tật Ách", "Thiên Di"],
  };
  const palaceEvidence = (palaceNamesByChapter[chapter.key] || [])
    .map((name) => palaceByName(chart, name))
    .filter((palace): palace is NonNullable<ReturnType<typeof palaceByName>> => Boolean(palace))
    .map((palace) => {
      const stars = starsWithStates(chart, [...palace.yearlyStars, ...palace.mainStars, ...palace.supportStars].slice(0, 5), palace.name, `vòng ${palace.lifecycle}`);
      return `${palace.name} tại ${palace.branch}: ${stars}`;
    });
  if (palaceEvidence.length) return palaceEvidence.slice(0, 5);
  return fallbackEvidence.split("\n").filter(Boolean).slice(0, 5);
}

function fallbackChapterLead(chapter: PaidReadingChapter, viewerAddress: string) {
  const leads: Record<string, string> = {
    overview: `Bản tổng quan nên được đọc như bản đồ định hướng: đâu là trục mạnh để ${viewerAddress} phát huy, đâu là vùng cần đi chậm và kiểm tra kỹ trước khi quyết định.`,
    "menh-than": `Bước vào Mệnh và Thân, trọng tâm không phải là gọi tên thật nhiều sao mà là hiểu khí chất vận hành: ${viewerAddress} phản ứng ra sao khi có áp lực, khi có cơ hội và khi phải chọn đường dài.`,
    "twelve-palaces": "Ở phần 12 cung, mỗi cung được xem như một vùng đời sống. Cung sáng cho biết nơi có thể chủ động đầu tư, cung căng cho biết nơi cần quy trình, giới hạn và người hỗ trợ.",
    career: "Với công việc, lá số nên được chuyển thành cách chọn môi trường, vai trò và nhịp ra quyết định. Điểm thuận giúp chọn lợi thế; điểm căng giúp đặt hàng rào rủi ro.",
    money: "Với tài chính, trọng tâm là cách giữ nhịp tiền, tránh cam kết vượt sức và biết lúc nào nên tích lũy thay vì mở rộng.",
    relationship: "Với tình cảm và gia đình, phần luận cần đọc vào cách giao tiếp, trách nhiệm, nhu cầu an toàn và những điểm dễ tích tụ thành hiểu nhầm.",
    health: "Với sức khỏe và tinh thần, các tín hiệu tử vi chỉ nên xem như lời nhắc về nhịp sống, áp lực và thói quen cần điều chỉnh, không thay thế tư vấn y tế.",
    "yearly-months": "Với vận năm, điều quan trọng là chia nhịp thành từng tháng cụ thể để người đọc biết lúc nào nên tiến, lúc nào nên giữ, và lúc nào nên kiểm tra lại quyết định lớn.",
  };
  return leads[chapter.key] || `Phần này đọc ${chapter.title} theo hướng thực tế: chuyển thuật ngữ tử vi thành lựa chọn, rủi ro cần quản trị và hành động có thể làm ngay.`;
}

function getFocusData(chart: TuViChart, type: ReadingKey, scopeKey: string) {
  const palace = chart.palaces.find((item) => item.name === scopeKey || item.branch === scopeKey);
  if (palace) {
    return {
      title: `${palace.name} tại ${palace.branch}`,
      evidence: [
        `Chính tinh: ${starsWithStates(chart, palace.mainStars, palace.name, "không có")}`,
        `Phụ tinh: ${starsWithStates(chart, palace.supportStars, palace.name, "bình hòa")}`,
        `Lưu niên: ${starsWithStates(chart, palace.yearlyStars, palace.name, "không nổi bật")}`,
        `Vòng trường sinh: ${palace.lifecycle}`,
      ],
    };
  }

  const decade = compactDecadeContext(chart);
  const majorPeriod = chart.daiVan.find((period) => period.range === scopeKey);
  if (majorPeriod) {
    const periodPalace = chart.palaces.find((item) => item.name === majorPeriod.palace);
    return {
      title: `Đại vận ${majorPeriod.range} tuổi tại cung ${majorPeriod.palace}`,
      evidence: [
        `Giai đoạn: ${majorPeriod.range} tuổi`,
        `Cung đại vận: ${majorPeriod.palace} tại ${majorPeriod.branch}`,
        `Chính tinh: ${periodPalace ? starsWithStates(chart, periodPalace.mainStars, periodPalace.name, "vô chính diệu") : "đang cập nhật"}`,
        `Phụ tinh: ${periodPalace ? starsWithStates(chart, periodPalace.supportStars, periodPalace.name, "không nổi bật") : "đang cập nhật"}`,
        `Sao lưu năm: ${periodPalace ? starsWithStates(chart, periodPalace.yearlyStars, periodPalace.name, "không nổi bật") : "không nổi bật"}`,
      ],
    };
  }

  const minorYear = scopeKey.match(/^tieu-(\d{4})$/)?.[1];
  if (minorYear) {
    const year = Number(minorYear);
    const age = year - chart.solar.year;
    const period = chart.daiVan.find((item) => {
      const [start, end] = item.range.split("-").map(Number);
      return age >= start && age <= end;
    });
    return {
      title: `Tiểu vận năm ${year}`,
      evidence: [
        `Năm tiểu vận: ${year}, tuổi ${age}`,
        period ? `Nền đại vận: ${period.range} tuổi tại cung ${period.palace}` : "Nền đại vận: chưa xác định",
        `Năm xem gốc: ${chart.input.viewYear}`,
        `Mệnh/Thân: ${chart.menh} / ${chart.than}`,
        `Sao lưu niên cần xét: L.Thái Tuế, L.Lộc Tồn, L.Kình Dương, L.Đà La, L.Tang Môn, L.Bạch Hổ nếu có trong JSON`,
      ],
    };
  }

  const monthlyScope = scopeKey.match(/^(\d{4})-(\d{2})$/);
  if (monthlyScope) {
    return {
      title: `Nguyệt vận tháng ${Number(monthlyScope[2])} năm ${monthlyScope[1]}`,
      evidence: [
        `Tháng cần luận: ${monthlyScope[2]}/${monthlyScope[1]}`,
        `Nền năm xem: ${chart.input.viewYear}`,
        `Mệnh/Thân/Cục: ${chart.menh} / ${chart.than} / ${chart.cuc}`,
        `Cung trọng yếu cần đối chiếu: Mệnh, Quan Lộc, Tài Bạch, Phu Thê, Tật Ách, Thiên Di`,
      ],
    };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(scopeKey) || scopeKey === "today") {
    return {
      title: `Nhật vận cá nhân hóa ${scopeKey}`,
      evidence: [
        `Ngày cần luận: ${scopeKey}`,
        `Năm xem của lá số: ${chart.input.viewYear}`,
        `Tuổi/năm sinh: ${chart.canChi.year}`,
        `Mệnh/Thân/Cục: ${chart.menh} / ${chart.than} / ${chart.cuc}`,
        `Khi luận ngày phải dùng dữ liệu xem ngày đã tính ở UI nếu có, và đối chiếu Mệnh/Thân/vận năm trong JSON`,
      ],
    };
  }

  return {
    title: `${FEATURE_PRICES[type].label} - ${scopeKey}`,
    evidence: [
      `Mệnh: ${chart.menh}`,
      `Thân: ${chart.than}`,
      `Cục: ${chart.cuc}`,
      `Cân lượng cốt: ${chart.boneWeight?.label || "đang cập nhật"}`,
      `Lai nhân: ${chart.laiNhan || "đang cập nhật"}`,
      `Âm dương: ${chart.amDuong}`,
      `Đại vận hiện tại: ${decade.current}`,
    ],
  };
}

function freeOverviewPrompt(chart: TuViChart) {
  const profile = buildChartEvidenceProfile(chart);
  const decade = compactDecadeContext(chart);

  return `Bạn là chuyên gia tử vi Việt Nam có 30 năm kinh nghiệm tư vấn đời sống. Hãy đọc dữ liệu lá số đã được hệ thống tính sẵn và viết một hồ sơ cá nhân ngắn. Không viết như bài blog.

Hồ sơ bằng chứng:
${formatChartEvidence(profile)}
- Đại vận hiện tại: ${decade.current}
- Tuổi trong năm xem: ${decade.currentAge}

Yêu cầu bắt buộc:
- Chỉ dùng bằng chứng đã cấp; không tự an sao, không tự thêm sự kiện.
- Mục tiêu 450-550 từ tiếng Việt. Hệ thống chấp nhận trong khoảng ${FREE_OVERVIEW_MIN_WORDS}-${FREE_OVERVIEW_MAX_WORDS} từ.
- Mỗi nhận định quan trọng phải gắn với một cung, sao, trạng thái sao, Tuần/Triệt hoặc đại vận trong hồ sơ.
- Không dùng lời khen chung chung, không dọa nạt, không khẳng định chắc chắn tương lai.
- Dùng ngôn ngữ tư vấn tài chính/đời sống: nêu xu hướng, điều kiện, cách kiểm chứng và hành động thực tế.
- Nêu một cơ hội cụ thể và một vùng rủi ro cụ thể, nhưng luôn diễn đạt là tín hiệu cần đối chiếu.
- Không chào hỏi dài, không giải thích tử vi như kiến thức phổ thông, không quảng cáo quá mức.
- Dùng đúng năm xem ${chart.input.viewYear}.
- Kết thúc bằng 3 bullet hành động ngắn.

Markdown đúng thứ tự:
## Chân dung nổi bật
## Điểm mạnh nên phát huy
## Cơ hội công việc và tài chính
## Điều cần thận trọng
## Gợi ý hành động trong năm ${chart.input.viewYear}`;
}

export function buildInstantFreeOverview(chart: TuViChart) {
  const profile = buildChartEvidenceProfile(chart);
  const decade = compactDecadeContext(chart);
  const menh = profile.palaces.find((palace) => palace.name === "Mệnh");
  const thanPalace = chart.palaces.find((palace) => palace.isThan);
  const than = profile.palaces.find((palace) => palace.name === thanPalace?.name);
  const career = profile.palaces.find((palace) => palace.name === "Quan Lộc");
  const money = profile.palaces.find((palace) => palace.name === "Tài Bạch");
  const health = profile.palaces.find((palace) => palace.name === "Tật Ách");
  const caution = profile.signals.find((signal) => signal.kind === "caution");

  return `## Chân dung nổi bật
Lá số của ${chart.input.fullName} được đọc trên trục Mệnh ${chart.menh}, Thân tại ${chart.than} và ${chart.cuc}. Cung Mệnh tại ${menh?.branch || chart.menh} có ${menh?.stars.slice(0, 4).join(", ") || "dữ liệu đang cập nhật"}; cung Thân thuộc ${than?.name || "cung đang cập nhật"} tại ${than?.branch || chart.than} có ${than?.stars.slice(0, 4).join(", ") || "dữ liệu đang cập nhật"}. Hai nhóm dữ kiện này cho thấy cách phù hợp nhất không phải là chạy theo một lời phán cố định, mà là nhận diện môi trường nào giúp năng lực phát huy ổn định. Đại vận hiện tại ${decade.current} đặt trọng tâm vào việc lựa chọn đúng người đồng hành, phạm vi cam kết và nhịp phát triển vừa sức.

## Điểm mạnh nên phát huy
Điểm mạnh đáng dùng của lá số nằm ở khả năng kết hợp khí chất Mệnh với cách hành động của Thân. Khi một quyết định quan trọng xuất hiện, ${chart.input.fullName} nên tách rõ mục tiêu, nguồn lực và mốc kiểm tra thay vì chỉ dựa vào cảm giác ban đầu. Dữ kiện tại Mệnh và Thân là cơ sở để ưu tiên những công việc có cấu trúc, có quyền chủ động và có phản hồi cụ thể. Nếu sao có trạng thái sáng, hãy dùng nó như lợi thế; nếu có trạng thái hãm hoặc tín hiệu căng, hãy biến nó thành quy trình kiểm tra chứ không xem là điểm yếu cố định.

## Cơ hội công việc và tài chính
Cung Quan Lộc tại ${career?.branch || "đang cập nhật"} có ${career?.stars.slice(0, 5).join(", ") || "chưa có sao nổi bật"}; cung Tài Bạch tại ${money?.branch || "đang cập nhật"} có ${money?.stars.slice(0, 5).join(", ") || "chưa có sao nổi bật"}. Hai cung cần được đọc cùng nhau: cơ hội tốt hơn thường đến khi năng lực nghề nghiệp tạo ra dòng tiền có thể đo được, không phải khi mở rộng quá nhanh. Trong năm ${chart.input.viewYear}, nên ưu tiên dự án có phạm vi rõ, thử ở quy mô nhỏ và đặt hạn mức rủi ro trước khi đầu tư. Nếu muốn đổi việc hoặc kinh doanh, hãy so sánh ba yếu tố: dòng tiền dự phòng, người hỗ trợ thực tế và thời điểm có thể dừng mà không tạo áp lực nợ.

## Điều cần thận trọng
Tín hiệu cần quản trị là ${caution?.evidence.join("; ") || `cung Tật Ách có ${health?.stars.slice(0, 4).join(", ") || "dữ liệu đang cập nhật"}`}. Đây không phải dự báo chắc chắn về biến cố. Nó là lời nhắc tránh quyết định lớn khi thông tin chưa đủ, cảm xúc đang cao hoặc lịch sinh hoạt đã quá tải. Với tài chính, cần đọc kỹ điều khoản, giấy tờ và nghĩa vụ dài hạn. Với quan hệ, nên nói rõ kỳ vọng thay vì để suy đoán kéo dài. Với sức khỏe, cung Tật Ách chỉ giúp nhắc nhịp nghỉ ngơi và dấu hiệu quá sức, không thay thế tư vấn y khoa.

## Gợi ý hành động trong năm ${chart.input.viewYear}
Năm ${chart.input.viewYear}, mục tiêu hợp lý là biến lợi thế của Mệnh và Thân thành các bước có thể kiểm chứng. Hãy chọn một ưu tiên chính cho mỗi giai đoạn, giữ quỹ dự phòng và rà soát lại sau mỗi quyết định quan trọng. Bản mini-report này giúp xác định điểm bắt đầu; hồ sơ VIP sẽ nối đủ 12 cung, đại vận và các mốc trong năm thành một kế hoạch chi tiết hơn.

- Chọn một mục tiêu công việc hoặc tài chính trong 30 ngày và đặt tiêu chí đo kết quả.
- Giữ hạn mức rủi ro, kiểm tra giấy tờ và xin ý kiến chuyên môn trước cam kết lớn.
- Theo dõi nhịp ngủ nghỉ, cảm xúc và dòng tiền để điều chỉnh sớm thay vì xử lý khi đã quá tải.`;
}

export async function generateFreeOverview(chart: TuViChart) {
  const prompt = freeOverviewPrompt(chart);
  if (isLlmDisabledForSmoke()) return { content: buildInstantFreeOverview(chart), model: "template-fallback", prompt };
  const routed = await generateWithLlmRouter({
    prompt,
    maxTokens: FREE_OVERVIEW_MAX_TOKENS,
    temperature: 0.55,
    providerOrder: [...READING_PROVIDER_ORDER],
  });
  if (routed) return { content: routed.text, model: routed.model, prompt };
  return { content: buildInstantFreeOverview(chart), model: "template-fallback", prompt };
}

export function paidReadingChapters(chart: TuViChart, type: ReadingKey): PaidReadingChapter[] {
  const year = chart.input.viewYear;

  if (type !== "FULL") {
    const scopeTitles: Record<ReadingKey, { title: string; instruction: string; targetWords: string }> = {
      FULL: { title: "Luận giải toàn bộ", instruction: "", targetWords: "" },
      PALACE: {
        title: "Luận sâu theo từng cung",
        instruction:
          "Viết như một bài tư vấn riêng cho cung đang mở. Giải thích điểm số/cung/sao theo ngôn ngữ đời sống hiện đại, nhưng vẫn dẫn chứng bằng thuật ngữ tử vi. Tập trung vào ý nghĩa của cung đó, ảnh hưởng thực tế, điểm nên phát huy và điểm cần quản trị.",
        targetWords: "900-1300 từ",
      },
      DAI_VAN: {
        title: "Luận giai đoạn đại vận",
        instruction:
          "Viết về giai đoạn 10 năm đang mở khóa: bối cảnh, cơ hội, thách thức, việc nên ưu tiên, cách quản trị rủi ro. Nêu rõ đây là định hướng dài hạn, không kết luận cứng.",
        targetWords: "1000-1500 từ",
      },
      TIEU_VAN: {
        title: "Luận tiểu vận",
        instruction:
          "Viết về năm đang mở khóa trong nền đại vận 10 năm: trọng tâm năm, cơ hội thực tế, áp lực cần quản trị, các việc nên làm theo quý và cách đọc năm này mà không tách khỏi bối cảnh dài hạn.",
        targetWords: "900-1300 từ",
      },
      NGUYET_VAN: {
        title: "Luận nguyệt vận",
        instruction:
          "Viết về tháng đang mở khóa: trọng tâm tháng, công việc, tài chính, tình cảm/gia đình, sức khỏe/tinh thần và việc nên tránh. Bám vào dữ kiện lá số, sao lưu/vận hạn và lịch ngày nếu có.",
        targetWords: "800-1200 từ",
      },
      NHAT_VAN: {
        title: "Luận nhật vận cá nhân hóa",
        instruction:
          "Viết về ngày đang xem theo lá số cá nhân: mức thuận lợi, việc hợp để làm, việc nên chậm lại, giờ/nhịp hành động nên ưu tiên. Giữ giọng mềm, thực tế, không hù dọa.",
        targetWords: "700-1000 từ",
      },
    };
    const config = scopeTitles[type];
    return [
      {
        key: "focused-reading",
        title: config.title,
        requiredSections: ["Tóm tắt dễ hiểu", "Dữ kiện tử vi đã dùng", "Luận giải theo đời sống", "Điều cần lưu ý", "Gợi ý nên làm"],
        instruction: config.instruction,
        targetWords: config.targetWords,
      },
    ];
  }

  return [
    {
      key: "overview",
      title: "Chương 1: Tổng quan lá số",
      requiredSections: ["Dữ kiện lá số đã dùng", "Luận giải chính", "Điều nên lưu ý", "Gợi ý hành động"],
      instruction: "Mở đầu báo cáo toàn bộ. Tóm tắt Mệnh, Thân, Cục, âm dương, cân lượng, đại vận hiện tại, lai nhân cung và các tín hiệu nổi bật nhất. Nhắc rõ 5 điểm định hướng chỉ là chỉ báo tham khảo.",
      targetWords: "900-1400 từ",
    },
    {
      key: "menh-than",
      title: "Chương 2: Mệnh, Thân và khí chất cốt lõi",
      requiredSections: ["Dữ kiện lá số đã dùng", "Luận giải chính", "Điều nên lưu ý", "Gợi ý hành động"],
      instruction: "Phân tích Mệnh/Thân, chính tinh, phụ tinh, trạng thái Miếu/Vượng/Đắc/Bình/Hãm và cách các tín hiệu này thể hiện khí chất, cách ra quyết định, xu hướng trưởng thành.",
      targetWords: "1000-1500 từ",
    },
    {
      key: "twelve-palaces",
      title: "Chương 3: 12 cung trọng yếu",
      requiredSections: ["Dữ kiện lá số đã dùng", "Luận giải chính", "Điều nên lưu ý", "Gợi ý hành động"],
      instruction: "Luận đủ 12 cung. Viết sâu hơn cho Mệnh, Thân, Quan Lộc, Tài Bạch, Phu Thê, Tật Ách, Thiên Di. Các cung còn lại viết ngắn hơn nhưng vẫn có ý nghĩa rõ.",
      targetWords: "1500-2200 từ",
    },
    {
      key: "career",
      title: "Chương 4: Công việc và định hướng sự nghiệp",
      requiredSections: ["Dữ kiện lá số đã dùng", "Luận giải chính", "Điều nên lưu ý", "Gợi ý hành động"],
      instruction: "Luận về khuynh hướng nghề nghiệp, cách làm việc, môi trường phù hợp, cơ hội thăng tiến, cách quản trị áp lực và điểm cần tránh trong năm xem.",
      targetWords: "900-1400 từ",
    },
    {
      key: "money",
      title: "Chương 5: Tài chính và cách quản trị tiền bạc",
      requiredSections: ["Dữ kiện lá số đã dùng", "Luận giải chính", "Điều nên lưu ý", "Gợi ý hành động"],
      instruction: "Luận về dòng tiền, thói quen tích lũy, rủi ro chi tiêu/đầu tư, cách kiểm soát nợ và cách quyết định tài chính thận trọng.",
      targetWords: "900-1400 từ",
    },
    {
      key: "relationship",
      title: "Chương 6: Tình cảm, hôn nhân, gia đình",
      requiredSections: ["Dữ kiện lá số đã dùng", "Luận giải chính", "Điều nên lưu ý", "Gợi ý hành động"],
      instruction: "Luận về quan hệ gia đình, hôn nhân, cách giao tiếp, cảm xúc, trách nhiệm và cách giữ hòa khí. Không phán cứng chuyện ly hợp hay mất mát.",
      targetWords: "900-1400 từ",
    },
    {
      key: "health",
      title: "Chương 7: Sức khỏe, tinh thần, nhịp sống",
      requiredSections: ["Dữ kiện lá số đã dùng", "Luận giải chính", "Điều nên lưu ý", "Gợi ý hành động"],
      instruction: "Luận về nhịp nghỉ ngơi, sức khỏe tinh thần, dấu hiệu quá tải, thói quen nên điều chỉnh. Ghi rõ không thay thế tư vấn y tế chuyên môn.",
      targetWords: "800-1200 từ",
    },
    {
      key: "yearly-months",
      title: `Chương 8: Vận hạn năm ${year} và gợi ý theo từng tháng`,
      requiredSections: ["Dữ kiện lá số đã dùng", "Luận giải chính", "Điều nên lưu ý", "Gợi ý hành động"],
      instruction: `Tổng hợp vận hạn năm ${year}, đại vận hiện tại, sao lưu niên và lời khuyên hành động. BẮT BUỘC có gợi ý đủ 12 tháng: mỗi tháng nêu trọng tâm, việc nên ưu tiên, việc nên tránh, lưu ý cảm xúc/sức khỏe/tài chính nếu cần.`,
      targetWords: "1500-2200 từ",
    },
  ];
}

function paidReadingQualityRules() {
  return `Khung chất lượng bắt buộc để bài trả phí có cảm giác "wow":
- Tránh hiệu ứng Barnum: không viết lời phán ai đọc cũng thấy đúng. Mỗi luận điểm quan trọng phải gắn với một tình huống cụ thể trong đời sống, ví dụ cách làm việc, cách giữ tiền, cách chọn người hợp tác, kiểu xung đột dễ gặp hoặc phản ứng tâm lý khi bị áp lực.
- Chuyển đặc tính thành vũ khí và cạm bẫy: với mỗi nét nổi bật, phải nói rõ nó giúp người đọc thắng ở đâu, và khi quá đà sẽ hại họ ở đâu. Không dừng lại ở mô tả tốt/xấu.
- Văn phong uyên bác nhưng thấu cảm: thuật ngữ tử vi phải đi kèm diễn giải đời sống hiện đại ngay sau đó. Giữ thuật ngữ như Hóa Lộc, Tuần, Triệt, Kình Dương khi cần làm bằng chứng, nhưng không để danh sách sao lấn át trải nghiệm đọc.
- Actionable Advice: cuối mỗi phần phải có lời khuyên rõ việc nên làm, nên tránh, môi trường nên chọn, kiểu người/đối tác nên thận trọng, và cách cân bằng nhược điểm.
- Ẩn giàn giáo dữ liệu: không bê nguyên bảng sao dài vào thân bài. Phần dữ kiện chỉ chọn 3-5 bằng chứng mạnh nhất rồi chuyển ngay sang câu chuyện ứng dụng.
- Luôn có một câu nối thời gian: Quá khứ -> nguyên nhân hiện tại -> định hướng tương lai, nhất là khi luận đại vận, tiểu vận, nguyệt vận hoặc nhật vận.`;
}

function paidTemporalGuidance(chart: TuViChart, type: ReadingKey, scopeKey: string) {
  const viewYear = chart.input.viewYear;
  const currentAge = chartAge(chart);
  const yearFromScope =
    Number(scopeKey.match(/^tieu-(\d{4})$/)?.[1]) ||
    Number(scopeKey.match(/^(\d{4})-\d{2}(?:-\d{2})?$/)?.[1]) ||
    (type === "FULL" ? viewYear : 0);
  const range = scopeKey.match(/^(\d+)-(\d+)$/);
  const rangeEnd = range ? Number(range[2]) : null;
  const isPastYear = Boolean(yearFromScope && yearFromScope < viewYear);
  const isPastAgeRange = rangeEnd !== null && rangeEnd < currentAge;

  if (isPastYear || isPastAgeRange) {
    return `Bối cảnh thời gian: Phạm vi này nằm trong quá khứ so với năm xem ${viewYear}.
- không khuyên người đọc làm việc trong năm đã qua. Hãy đọc giai đoạn đó như nguyên nhân, vết hằn, tài sản ngầm hoặc bài học còn ảnh hưởng đến hiện tại.
- Quá khứ -> nguyên nhân hiện tại -> định hướng tương lai: bắt buộc có một đoạn giải thích vì sao người đọc cần nhìn lại giai đoạn này vào lúc này.
- Khi nói về chuyện đã qua, không dùng cụm "có thể bạn đã". Hãy dùng giọng khẳng định mềm và thấu cảm như "giai đoạn này thường để lại...", "dấu ấn này dễ khiến...", "bài học còn sót lại là...".
- Phần gợi ý nên tập trung xử lý tàn dư của giai đoạn cũ: gỡ lớp phòng thủ, khai thác kỹ năng/tài sản ngầm, hàn gắn hoặc buông bỏ triệt để các mâu thuẫn còn kéo dài.`;
  }

  return `Bối cảnh thời gian: Phạm vi này thuộc hiện tại hoặc tương lai gần so với năm xem ${viewYear}.
- Viết theo hướng tham vấn hành động: người đọc nên ưu tiên gì trước, nên trì hoãn gì, dấu hiệu nào cần theo dõi lại.
- Nếu có rủi ro, chuyển thành kế hoạch quản trị: giảm tốc, kiểm tra giấy tờ/tiền bạc/sức khỏe/quan hệ, đặt mốc đánh giá lại.
- Nếu có điểm sáng, chỉ rõ cách biến nó thành lợi thế thực tế trong công việc, tiền bạc, quan hệ hoặc nhịp sống.`;
}

function paidReadingUpperTargetWords(chapter?: PaidReadingChapter, fallback = 900) {
  const matches = chapter?.targetWords.match(/\d[\d.]*/g);
  if (!matches?.length) return fallback;
  const values = matches.map((value) => Number(value.replace(/\./g, ""))).filter((value) => Number.isFinite(value) && value > 0);
  return values.length ? Math.max(...values) : fallback;
}

export function paidReadingMaxTokens(type: ReadingKey, chapter?: PaidReadingChapter) {
  if (type === "FULL") {
    const targetWords = paidReadingUpperTargetWords(chapter, 1400);
    return Math.min(PAID_READING_CHAPTER_MAX_TOKENS, Math.max(3400, Math.ceil(targetWords * 3)));
  }
  if (type === "DAI_VAN") return 4600;
  if (type === "PALACE" || type === "TIEU_VAN") return 4200;
  if (type === "NGUYET_VAN") return 3400;
  if (type === "NHAT_VAN") return 2600;

  const target = paidReadingUpperTargetWords(chapter);
  return Math.min(PAID_READING_CHAPTER_MAX_TOKENS, Math.max(2600, Math.ceil(target * 3.8)));
}

export function paidReadingChapterPrompt(
  chart: TuViChart,
  type: ReadingKey,
  scopeKey: string,
  focus: ReturnType<typeof getFocusData>,
  chapter: PaidReadingChapter,
  index: number,
  total: number,
) {
  const summary = getDeepReadingSummary(chart);
  const scoreLines = summary.scores.map((score) => `${score.label}: ${score.value}/100`).join("; ");
  const sectionLines = chapter.requiredSections.map((section) => `## ${section}`).join("\n");
  const isFullReport = type === "FULL";
  const unitName = isFullReport ? "chương" : "phần luận giải";
  const startLine = isFullReport ? `# ${chapter.title}` : `# ${FEATURE_PRICES[type].label}: ${scopeKey}`;
  const temporalGuidance = paidTemporalGuidance(chart, type, scopeKey);
  const dataContext = paidReadingDataContext(chart, type, scopeKey, focus);
  const evidenceProfile = formatChartEvidence(buildChartEvidenceProfile(chart));
  const yearlyMonthContext = chapter.key === "yearly-months" ? `\n\n${yearlyMonthContextBlock(chart)}` : "";

  return `Bạn là chuyên gia tử vi Việt Nam. Hãy viết ${unitName} ${isFullReport ? `${chapter.title} (${index + 1}/${total})` : "đang mở khóa"} cho báo cáo trả phí.

Loại luận: ${FEATURE_PRICES[type].label}
Phạm vi: ${scopeKey}
Người xem: ${chart.input.fullName}
Giới tính: ${chart.input.gender === "female" ? "Nữ" : "Nam"}
Tuổi theo năm xem: ${summary.age}
Xưng hô ưu tiên trong bài: ${summary.viewerAddress}
Năm xem: ${chart.input.viewYear}
Mục tiêu toàn bộ bản FULL/all: ${PAID_FULL_WORD_TARGET}; riêng chương này: ${chapter.targetWords}
Chiến lược prompt: ${PAID_READING_VERSION}
Điểm định hướng đầu báo cáo: ${scoreLines}
Trọng tâm dữ liệu: ${focus.title}

Dữ liệu nổi bật:
- ${focus.evidence.join("\n- ")}

Hồ sơ bằng chứng dùng chung:
${evidenceProfile}

${paidReadingQualityRules()}

${temporalGuidance}

${dataContext}${yearlyMonthContext}

Yêu cầu bắt buộc:
- Chỉ viết ${unitName} này, không viết lan sang phạm vi khác.
- Viết như hồ sơ tư vấn riêng cho ${chart.input.fullName}; không viết như bài blog kiến thức chung.
- Mỗi kết luận quan trọng phải nối với ít nhất một bằng chứng cung, sao, trạng thái sao, Tuần/Triệt hoặc đại vận đã cấp.
- Phân tích rõ điểm mạnh, điểm yếu cần quản trị, cơ hội tài chính/đời sống và thời điểm rủi ro khi phù hợp với chương.
- Không tự tính lại lá số, không đổi ngày giờ, không tự thêm sao ngoài dữ liệu đã cấp.
- Không lặp lại lời chào ở đầu chương: chỉ Chương 1 được chào rất ngắn nếu thật cần, các chương 2-8 đi thẳng vào vấn đề.
- Tuyệt đối không được in lại nhãn nội bộ hoặc câu lệnh prompt như "Loại luận", "Phạm vi", "Chiến lược prompt", "Trọng tâm dữ liệu", "Trọng tâm nội dung", "Dữ liệu nổi bật", "Dữ liệu 12 cung", "Dữ liệu lá số JSON"; chỉ xuất bản văn hoàn chỉnh cho khách hàng.
- Nội dung phải tạo cảm giác an tâm, rõ ràng, đáng tiền cho người đọc 30-60 tuổi.
- BẮT BUỘC độ dài riêng phần này: ${chapter.targetWords}; không trả lời ngắn hơn mốc dưới của phạm vi này.
- Xưng hô tự nhiên theo dữ liệu: dùng "${summary.viewerAddress}" khi cần gọi trực tiếp người xem.
- Bắt đầu bằng đúng dòng Markdown: ${startLine}
- Phải có đúng các heading dưới đây, đúng thứ tự:
${sectionLines}
- Ở phần dữ kiện: chỉ ghi 3-5 bằng chứng tử vi mạnh nhất, có thể nêu trạng thái sao (M/V/Đ/B/H), nhưng không liệt kê giàn giáo dữ liệu dài. Mỗi bằng chứng phải có một câu diễn giải đời sống đi kèm.
- Ở phần luận giải: giải thích sâu bằng các tình huống cụ thể, nhưng mỗi đoạn tối đa 3-4 dòng khi đọc trên điện thoại.
- Ở phần lưu ý: mọi sao hãm, sát tinh, lưu sát tinh phải chuyển thành lời khuyên quản trị rủi ro; không dọa, không kết luận tuyệt đối.
- Ở phần gợi ý: dùng ít nhất 3 bullet hành động rõ việc nên làm, nên tránh, nhịp kiểm tra lại.
- Nếu là vận năm hoặc nguyệt/nhật vận, hãy nêu trọng tâm thời gian đang mở khóa thật cụ thể.
- Nếu chương là vận năm, bắt buộc có đủ 12 tháng trong năm ${chart.input.viewYear}; dựa vào Bảng ngữ cảnh 12 tháng, mỗi tháng phải có trọng tâm riêng, ưu tiên riêng, điều nên tránh riêng, không lặp vòng theo mẫu.
- Không dùng từ ngữ quá kỹ thuật hoặc quá mê tín. Viết như một chuyên gia đang tư vấn bình tĩnh cho người trưởng thành.

Trọng tâm nội dung:
${chapter.instruction}`;
}

function fallbackChapterBody(chart: TuViChart, chapter: PaidReadingChapter, focus?: ReturnType<typeof getFocusData>) {
  const summary = getDeepReadingSummary(chart);
  const focusPalaces = compactImportantPalaces(chart).split("\n").slice(0, 4).join("\n- ");
  const focusEvidence = focus ? focus.evidence.join("\n- ") : focusPalaces;
  if (chapter.key === "focused-reading") {
    return `# ${focus?.title || chapter.title}

## Tóm tắt dễ hiểu
Phần này đọc riêng ${focus?.title || "phạm vi đang mở khóa"} cho ${summary.viewerAddress} ${chart.input.fullName}. Nội dung chỉ dùng dữ liệu lá số đã tính sẵn, tập trung vào ý nghĩa thực tế, điểm nên phát huy và điều cần quản trị trong đời sống.

## Dữ kiện tử vi đã dùng
- Mệnh: ${chart.menh}; Thân: ${chart.than}; Cục: ${chart.cuc}; năm xem ${chart.input.viewYear}.
- Trọng tâm mở khóa: ${focus?.title || chapter.title}.
- Dữ kiện nổi bật:
- ${focusEvidence}

## Luận giải theo đời sống
Các tín hiệu tử vi trong phần này nên được hiểu như bản định hướng. Điểm thuận lợi giúp ${summary.viewerAddress} biết vùng nào có thể chủ động phát huy; điểm khó là lời nhắc để đi chậm, kiểm tra kỹ và có kế hoạch dự phòng.

Với phạm vi đang mở, nên ưu tiên cách làm rõ ràng, tránh quyết định theo cảm xúc nhất thời. Nếu có sao hãm, sát tinh hoặc sao lưu gây áp lực, ý nghĩa chính là quản trị rủi ro chứ không phải một kết luận chắc chắn.

Nếu đây là cung, hãy đọc cung đó như một vùng đời sống cần quản trị: đâu là điểm sáng có thể dùng, đâu là điểm dễ quá tay, và khi nào nên hỏi thêm người có chuyên môn. Nếu đây là vận hạn theo năm, tháng hoặc ngày, hãy đặt nó vào nền đại vận và bối cảnh năm xem để người đọc không hiểu rời rạc. Mục tiêu là giúp ${summary.viewerAddress} biết nên ưu tiên điều gì trước, điều gì nên trì hoãn và dấu hiệu nào cần theo dõi lại.

Một phần luận giải có giá trị không nên chỉ nói tốt xấu. Nó cần chỉ ra vì sao lá số gợi ý như vậy, liên hệ với công việc, tài chính, quan hệ, sức khỏe tinh thần và nhịp sống. Khi tín hiệu thuận mạnh, lời khuyên vẫn cần điều kiện đi kèm; khi tín hiệu căng, lời khuyên phải chuyển thành kế hoạch giảm rủi ro, không tạo cảm giác sợ hãi.

## Điều cần lưu ý
- Không nên dùng phần luận này để thay thế quyết định chuyên môn về tài chính, pháp lý hoặc y tế.
- Khi có nhiều tín hiệu căng, hãy giảm tốc độ, kiểm tra giấy tờ, tiền bạc và các cam kết quan trọng.
- Giữ nhịp sinh hoạt ổn định sẽ giúp giảm tác động của các giai đoạn dễ dao động.

## Gợi ý nên làm
- Chọn 1 việc quan trọng nhất trong 7-30 ngày tới và làm từng bước có kiểm tra.
- Tránh hứa quá nhiều hoặc mở rộng việc mới khi nguồn lực chưa rõ.
- Ghi lại các quyết định lớn để sau này đối chiếu lại với thực tế.
- Nếu đang cân nhắc việc lớn, hãy chia thành 2-3 bước nhỏ, mỗi bước có tiêu chí dừng rõ ràng.
- Khi thấy áp lực tăng, ưu tiên ngủ nghỉ, sức khỏe, giấy tờ và dòng tiền trước khi nhận thêm cam kết.`;
  }
  const monthAdvice =
    chapter.key === "yearly-months"
      ? `\n\nGợi ý 12 tháng trong năm ${chart.input.viewYear}:\n${yearlyMonthGuidanceLines(chart).join("\n")}`
      : "";
  const evidenceLines = fallbackEvidenceForChapter(chart, chapter, focusEvidence);
  const lead = fallbackChapterLead(chapter, summary.viewerAddress);

  return `# ${chapter.title}

## Dữ kiện lá số đã dùng
- ${evidenceLines.join("\n- ")}
- Ghi chú chuyên môn: phần này chỉ giữ các bằng chứng mạnh nhất để người đọc không bị rối bởi danh sách sao dài.

## Luận giải chính
${lead}

Các bằng chứng trên nên được hiểu như chỉ báo tham vấn. Điểm thuận lợi giúp ${summary.viewerAddress} biết vùng nào có thể chủ động phát huy; điểm căng là lời nhắc để đi chậm, đặt mốc kiểm tra và có kế hoạch dự phòng.

Khi gặp sao hãm, sát tinh, Tuần/Triệt hoặc sao lưu gây áp lực, phần luận không nên biến thành lời phán cứng. Cách đọc hữu ích hơn là chuyển nó thành câu hỏi hành động: việc nào cần kiểm tra thêm, cam kết nào nên làm chậm lại, quan hệ nào cần nói rõ hơn, và nguồn lực nào cần giữ lại trước khi mở rộng.

## Điều nên lưu ý
- Các sao hãm, sát tinh hoặc sao lưu có tính căng không nên hiểu là điều chắc chắn sẽ xảy ra. Chúng là tín hiệu nhắc ${summary.viewerAddress} làm chậm lại, kiểm tra kỹ tiền bạc, giấy tờ, sức khỏe và quan hệ.
- Không nên quyết định lớn khi thông tin chưa đủ rõ hoặc cảm xúc đang bị đẩy lên cao.
- Nếu một giai đoạn có nhiều áp lực, ưu tiên giữ nhịp sinh hoạt, ngủ nghỉ và kế hoạch dự phòng trước khi mở rộng việc mới.

## Gợi ý hành động
- Chọn 1-2 việc quan trọng nhất trong 30 ngày tới, làm rõ mục tiêu, người hỗ trợ và tiêu chí kiểm tra.
- Với tiền bạc, nên có hạn mức rủi ro và ghi lại dòng tiền trước khi cam kết lớn.
- Với quan hệ, nên nói rõ nhu cầu bằng lời nhẹ, tránh im lặng kéo dài thành hiểu nhầm.${monthAdvice}`;
}

async function generatePaidChapter(prompt: string, maxTokens: number, geminiModel?: string) {
  const routed = await generateWithLlmRouter({
    prompt,
    maxTokens,
    temperature: 0.55,
    geminiModel,
    providerOrder: [...READING_PROVIDER_ORDER],
  });
  if (routed) return { content: routed.text, model: routed.model };
  return null;
}
