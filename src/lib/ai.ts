import { type TuViChart } from "@/lib/chart";
import { buildChartEvidenceProfile, formatChartEvidence } from "@/lib/chart-evidence";
import { buildFreeOverviewFromInterpretationRules } from "@/lib/free-overview-engine";
import { generateWithLlmRouter, hasExternalLlmProvider } from "@/lib/llm-router";
import { FEATURE_PRICES, type ReadingKey } from "@/lib/pricing";

export const FREE_OVERVIEW_MIN_WORDS = 1000;
export const FREE_OVERVIEW_MAX_WORDS = 1200;
export const FREE_OVERVIEW_MAX_TOKENS = 3800;
export const FREE_OVERVIEW_REPAIR_MAX_TOKENS = 3200;
export const FREE_OVERVIEW_TEMPLATE_MIN_WORDS = 1400;
export const FREE_OVERVIEW_TEMPLATE_MAX_WORDS = 1650;
export const FREE_OVERVIEW_PREVIEW_MIN_WORDS = 150;
export const FREE_OVERVIEW_PREVIEW_MAX_WORDS = 200;
export const FREE_OVERVIEW_PREVIEW_MAX_TOKENS = 900;
export const PAID_READING_CHAPTER_MAX_TOKENS = 7000;
export const FREE_OVERVIEW_VERSION = "free-mini-report-v9";
export const PAID_READING_VERSION = "paid-personal-dossier-v5";
export const PAID_FULL_WORD_TARGET = "5.000-7.000 từ";
export const READING_PROVIDER_ORDER = ["deepseek", "groq"] as const;

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
  const hasEnoughActionBullets = chapter.key === "action-plan" ? actionBulletCount >= 5 : chapter.key === "focused-reading" ? actionBulletCount >= 3 : true;
  const hasYearlyMonths =
    chapter.key !== "yearly-months" ||
    Array.from({ length: 12 }, (_, index) => `thang ${index + 1}`).every((month) => normalizedText(trimmed).includes(month));

  return hasStartLine && hasRequiredSections && hasEnoughWords && hasEnoughActionBullets && hasYearlyMonths;
}

export function isCompleteFreeOverview(content: string) {
  const requiredHeadings = [
    "## Tín hiệu nổi bật của lá số",
    "## Mỏ neo",
    "## Điểm đáng chú ý nhất",
    "## Khí chất và nội lực",
    "## Công việc và tài chính",
    "## Tình cảm và quan hệ",
    "## Sức khỏe và nhịp sống",
    "## Vận năm",
    "## Câu hỏi mở trước khi đi sâu",
  ];
  const wordCount = countWords(content);
  const hasChartEvidence = /(cung|mệnh|thân|sao|đại vận|tuần|triệt)/i.test(content);
  const questionBulletCount = (content.match(/^\s*[-*]\s+.+\?/gm) || []).length;
  const hasOldActionChecklist = content.includes("## Cẩm nang hành động");

  return (
    wordCount >= FREE_OVERVIEW_MIN_WORDS &&
    wordCount <= FREE_OVERVIEW_MAX_WORDS &&
    hasChartEvidence &&
    questionBulletCount >= 3 &&
    !hasOldActionChecklist &&
    requiredHeadings.every((heading) => content.includes(heading))
  );
}

export function isCompleteFreeOverviewPreview(content: string) {
  const wordCount = countWords(content);
  const hasChartEvidence = /(cung|mệnh|thân|sao|đại vận|tuần|triệt)/i.test(content);
  return (
    wordCount >= FREE_OVERVIEW_PREVIEW_MIN_WORDS &&
    wordCount <= FREE_OVERVIEW_PREVIEW_MAX_WORDS &&
    hasChartEvidence
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

function freeOverviewAudienceContext(chart: TuViChart) {
  const age = chartAge(chart);
  if (age <= 21) {
    return {
      lifeStage: "12-21 tuổi, học sinh/sinh viên hoặc mới bắt đầu đi làm thêm",
      workMoneyLanguage:
        "học tập, chọn ngành, lịch học, bài tập nhóm, câu lạc bộ, bạn bè, tiền tiêu vặt, tiền làm thêm part-time",
      workFocus: "học tập, chọn ngành, hoạt động nhóm và việc part-time",
      moneyFocus: "tiền tiêu vặt, học phí, khoản làm thêm và cách giữ một phần nhỏ để tự chủ",
      collaborationFocus: "bài tập nhóm, câu lạc bộ, dự án ở trường hoặc cam kết khi nhận việc part-time",
      decisionFocus: "chọn ngành học, định hướng tương lai gần và cách không bị cuốn theo áp lực bạn bè",
      anchorWorkLabel: "Nhịp học tập & định hướng",
      paidTeaser:
        "hồ sơ chuyên sâu sẽ chỉ ra ba bẫy tâm lý dễ gặp trong giai đoạn chọn ngành, bạn bè, nhóm học và tiền part-time",
    };
  }
  if (age <= 29) {
    return {
      lifeStage: "22-29 tuổi, giai đoạn vào nghề và tự lập",
      workMoneyLanguage:
        "công việc đầu đời, chọn môi trường, thu nhập mới, quỹ dự phòng nhỏ, hợp tác dự án, kỹ năng và hướng đi 1-3 năm",
      workFocus: "công việc đầu đời, kỹ năng, môi trường làm việc và hướng đi 1-3 năm",
      moneyFocus: "thu nhập mới, khoản dự phòng và các quyết định chi tiêu lớn đầu tiên",
      collaborationFocus: "dự án, hợp đồng thử việc, nhóm làm chung và kỳ vọng giữa đôi bên",
      decisionFocus: "chọn môi trường, chọn người hướng dẫn và chọn nhịp tăng trưởng",
      anchorWorkLabel: "Nhịp vào nghề & tài chính",
      paidTeaser:
        "hồ sơ chuyên sâu sẽ bóc tách điểm nên tăng tốc, điểm nên giữ nhịp và cách tránh chọn sai môi trường",
    };
  }
  return {
    lifeStage: "người trưởng thành, cần cân bằng công việc, tài chính, gia đình và sức khỏe",
    workMoneyLanguage:
      "vai trò công việc, dòng tiền, ngân sách, hợp tác, ranh giới trách nhiệm, gia đình và nhịp nghỉ",
    workFocus: "công việc, vai trò, tài chính và các cam kết dài hạn",
    moneyFocus: "dòng tiền, quỹ dự phòng và khả năng chịu rủi ro",
    collaborationFocus: "hợp tác, phạm vi trách nhiệm, quyền quyết định và cách dừng khi điều kiện thay đổi",
    decisionFocus: "ưu tiên sự nghiệp, gia đình, tài chính và sức khỏe trong cùng một nhịp sống",
    anchorWorkLabel: "Nhịp công việc & tài chính",
    paidTeaser:
      "hồ sơ chuyên sâu sẽ nối từng cung, đại vận và vận năm thành một lộ trình ưu tiên rõ hơn",
  };
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

export function buildPaidActionPlanContext(chapterContents: string[]) {
  const entries = chapterContents.map((content) => {
    const title = content.match(/^# (.+)$/m)?.[1]?.trim() || "Chương luận giải";
    const anchor = content.match(/^## Mỏ neo\s*\n([\s\S]*?)(?=^## |(?![\s\S]))/m)?.[1]?.trim() || "";
    const boldConclusions = Array.from(content.matchAll(/\*\*([^*]+)\*\*/g), (match) => match[1].trim());
    const points = Array.from(new Set([anchor, ...boldConclusions].filter(Boolean)));
    return `### ${title}\n${points.map((point) => `- ${point}`).join("\n")}`;
  });
  return entries.join("\n\n").slice(0, 12_000);
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

  const fallbackOutput = async (chapter: PaidReadingChapter, index: number, actionContext = "") => {
    const prompt = paidReadingChapterPrompt(chart, type, scopeKey, focus, chapter, index, chapters.length, actionContext);
    const content = fallbackChapterBody(chart, chapter, focus);
    const output: PaidReadingChapterOutput = {
      key: chapter.key,
      title: chapter.title,
      content,
      model: "template-fallback",
      prompt,
      wordCount: countWords(content),
      maxTokens: paidReadingMaxTokens(type, chapter),
      formatGuarded: false,
    };
    await emitProgress(index, output);
    return output;
  };

  if (isLlmDisabledForSmoke() || !hasExternalLlmProvider()) {
    const outputs: PaidReadingChapterOutput[] = [];
    for (const [index, chapter] of chapters.entries()) {
      const actionContext = chapter.key === "action-plan"
        ? buildPaidActionPlanContext(outputs.map((output) => output.content))
        : "";
      outputs.push(await fallbackOutput(chapter, index, actionContext));
    }
    return {
      content: outputs.map((chapter) => chapter.content.trim()).join("\n\n"),
      model: "template-fallback",
      prompt: JSON.stringify(paidReadingPromptMeta(chart, type, summary, outputs, "no-provider")),
    };
  }

  const generateChapter = async (chapter: PaidReadingChapter, index: number, actionContext = "") => {
    const prompt = paidReadingChapterPrompt(chart, type, scopeKey, focus, chapter, index, chapters.length, actionContext);
    const maxTokens = paidReadingMaxTokens(type, chapter);
    let generated: Awaited<ReturnType<typeof generatePaidChapter>> = null;
    let chapterError: string | null = null;
    try {
      generated = await generatePaidChapter(prompt, maxTokens);
    } catch (error) {
      chapterError = error instanceof Error ? error.message : String(error);
    }
    let generatedContent = generated?.content?.trim() || "";
    let hasCompleteContent = generatedContent ? isCompletePaidChapter(generatedContent, chapter) : false;

    if (!hasCompleteContent) {
      try {
        const retry = await generatePaidChapter(prompt, maxTokens);
        const retryContent = retry?.content?.trim() || "";
        if (retryContent) {
          generated = retry;
          generatedContent = retryContent;
          hasCompleteContent = isCompletePaidChapter(retryContent, chapter);
        }
      } catch (error) {
        chapterError = error instanceof Error ? error.message : String(error);
      }
    }

    const content = hasCompleteContent ? generatedContent : fallbackChapterBody(chart, chapter, focus);
    const output: PaidReadingChapterOutput = {
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
  };

  const actionIndex = type === "FULL" ? chapters.findIndex((chapter) => chapter.key === "action-plan") : -1;
  const interpretationChapters = actionIndex >= 0 ? chapters.slice(0, actionIndex) : chapters;
  const outputs = await runReadingChapterTasks(
    interpretationChapters,
    paidReadingConcurrencyLimit(type),
    (chapter, index) => generateChapter(chapter, index),
  );

  if (actionIndex >= 0) {
    const actionChapter = chapters[actionIndex];
    const actionContext = buildPaidActionPlanContext(outputs.map((output) => output.content));
    outputs.push(await generateChapter(actionChapter, actionIndex, actionContext));
  }

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

function compactFreeOverviewEvidence(
  chart: TuViChart,
  options: { starLimit?: number; signalLimit?: number } = {},
) {
  const profile = buildChartEvidenceProfile(chart);
  const starLimit = options.starLimit ?? 3;
  const signalLimit = options.signalLimit ?? 3;
  const thanPalaceName = chart.palaces.find((palace) => palace.isThan)?.name;
  const palaceNames = Array.from(
    new Set(
      ["Mệnh", thanPalaceName, "Quan Lộc", "Tài Bạch", "Phu Thê", "Tật Ách", "Thiên Di"].filter(
        (name): name is string => Boolean(name),
      ),
    ),
  );
  const palaceLines = palaceNames.map((name) => {
    const palace = profile.palaces.find((item) => item.name === name);
    if (!palace) return `- ${name}: chưa có dữ liệu nổi bật`;
    const stars = palace.stars.slice(0, starLimit).join(", ") || "không có sao nổi bật";
    const gates = [palace.hasTuan ? "Tuần" : "", palace.hasTriet ? "Triệt" : ""].filter(Boolean).join(", ");
    return `- ${name} tại ${palace.branch}: ${stars}${gates ? `; án ngữ ${gates}` : ""}`;
  });
  const signalLines = profile.signals.slice(0, signalLimit).map((signal) => {
    const evidence = signal.evidence.slice(0, 2).join(" | ");
    return `- ${signal.area}: ${signal.summary}${evidence ? ` (${evidence})` : ""}`;
  });

  return [
    "Hồ sơ bằng chứng rút gọn:",
    `- Họ tên: ${profile.fullName}`,
    `- Năm xem: ${profile.viewYear}`,
    `- Mệnh/Thân/Cục: ${profile.menh} / ${profile.than} / ${profile.cuc}`,
    "- Cung trọng tâm rút gọn:",
    ...palaceLines,
    "- Tín hiệu ưu tiên:",
    ...signalLines,
  ].join("\n");
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

  return `Thông tin kỹ thuật nội bộ cho người viết, không chép thành mục riêng và không mở đầu chương bằng mục dữ kiện:
${compactImportantPalaces(chart)}

Hồ sơ 12 cung đã an sao, chỉ dùng để chọn bằng chứng mạnh rồi lồng tự nhiên vào lời khuyên:
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
  const decade = compactDecadeContext(chart);
  const audience = freeOverviewAudienceContext(chart);

  return `Bạn là chuyên gia tử vi Việt Nam có 30 năm kinh nghiệm tư vấn đời sống. Hãy đọc dữ liệu lá số đã được hệ thống tính sẵn và viết một mini-report cá nhân có chiều sâu. Không viết như bài blog.

Hồ sơ bằng chứng:
${compactFreeOverviewEvidence(chart)}
- Đại vận hiện tại: ${decade.current}
- Tuổi trong năm xem: ${decade.currentAge}
- Bối cảnh ngôn ngữ cần dùng: ${audience.lifeStage}. Khi luận công việc/tài chính, hãy dịch sang các tình huống gần với người đọc: ${audience.workMoneyLanguage}.

Yêu cầu bắt buộc:
- Chỉ dùng bằng chứng đã cấp; không tự an sao, không tự thêm sự kiện.
- Mục tiêu 1.000-1.200 từ tiếng Việt. Hệ thống chấp nhận trong khoảng ${FREE_OVERVIEW_MIN_WORDS}-${FREE_OVERVIEW_MAX_WORDS} từ.
- Mở đầu bằng mục "Tín hiệu nổi bật của lá số" dài 650-900 ký tự, viết như một đoạn luận giải cô đọng cho người chưa đăng nhập: đánh trúng một cảm giác tâm lý thật trước, sau đó mới lồng 1-2 thuật ngữ tử vi trong ngoặc nếu cần. Không mở đầu bằng danh sách sao. Làm người đọc thấy đúng, tò mò và muốn mở hồ sơ chuyên sâu. Không dùng bullet trong mục này.
- Mỗi nhận định quan trọng phải gắn với một cung, sao, trạng thái sao, Tuần/Triệt hoặc đại vận trong hồ sơ.
- Không dùng lời khen chung chung, không dọa nạt, không khẳng định chắc chắn tương lai.
- Dùng ngôn ngữ tư vấn đời sống đúng độ tuổi. Nếu người đọc 12-21 tuổi, không dùng giọng của người đi làm lâu năm: "dòng tiền" phải chuyển thành tiền tiêu vặt/tiền part-time; "hợp tác văn bản" chuyển thành bài tập nhóm/câu lạc bộ/cam kết khi làm thêm; "phạm vi công việc" chuyển thành chọn ngành, hướng học, vai trò trong nhóm.
- Viết để người lớn tuổi vẫn đọc thấm: câu ngắn, ý rõ, không dùng giọng học thuật. Nếu cần nhắc thuật ngữ như Mệnh, Thân, Tuần, Triệt, Hóa Lộc, hãy giải thích thuật ngữ ngay bằng lời đời thường trong cùng câu hoặc câu kế tiếp.
- Nêu một cơ hội cụ thể và một vùng rủi ro cụ thể, nhưng luôn diễn đạt là tín hiệu cần đối chiếu.
- Mục "Mỏ neo" không dùng điểm số thô kiểu 35/100, 42/100. Hãy dùng nhãn trạng thái trung lập như "Năng lượng tĩnh", "Nhịp độ: cẩn trọng", "Tín hiệu năm: đi chậm để chắc". Nếu bắt buộc nhắc chỉ số, phải giải thích ngay đó là chỉ số biến động/cần đi chậm, không phải điểm kém.
- Chọn một mâu thuẫn, cơ hội hoặc điểm nghẽn cá nhân làm "Điểm đáng chú ý nhất" để tạo động lực đọc tiếp.
- Lồng cung và sao tự nhiên vào lời khuyên; không tạo mục liệt kê dữ kiện kỹ thuật.
- Mỗi phần phải bổ sung một góc nhìn mới, không lặp lại cùng một nhận định bằng cách đổi câu chữ.
- Phần sức khỏe chỉ đưa khuyến nghị nhịp sống thận trọng, không chẩn đoán và không thay thế tư vấn y khoa.
- Không chào hỏi dài, không giải thích tử vi như kiến thức phổ thông, không quảng cáo quá mức.
- Dùng đúng năm xem ${chart.input.viewYear}.
- Kết thúc bằng mục "Câu hỏi mở trước khi đi sâu": 4-6 câu hỏi gợi mở có dấu hỏi, chỉ nêu What/Why và nhá hàng ${audience.paidTeaser}; không đưa checklist How-to chi tiết trong bản miễn phí.

Markdown đúng thứ tự:
## Tín hiệu nổi bật của lá số
## Mỏ neo
## Điểm đáng chú ý nhất
## Khí chất và nội lực
## Công việc và tài chính
## Tình cảm và quan hệ
## Sức khỏe và nhịp sống
## Vận năm ${chart.input.viewYear}
## Câu hỏi mở trước khi đi sâu`;
}

function freeOverviewRepairPrompt(chart: TuViChart) {
  const decade = compactDecadeContext(chart);
  const audience = freeOverviewAudienceContext(chart);

  return `PROMPT REPAIR COMPACT
Viết lại mini-report miễn phí bằng tiếng Việt vì lần gọi trước trả về rỗng. Dùng ít dữ liệu, không tự an sao, không nhắc AI/LLM.

${compactFreeOverviewEvidence(chart, { starLimit: 2, signalLimit: 2 })}
- Đại vận hiện tại: ${decade.current}
- Tuổi trong năm xem: ${decade.currentAge}
- Bối cảnh người đọc: ${audience.lifeStage}. Nếu 12-21 tuổi, dùng ví dụ tiền tiêu vặt, part-time, bài tập nhóm, chọn ngành/hướng học.

Yêu cầu:
- Mục tiêu 1.050-1.200 từ, hệ thống chấp nhận ${FREE_OVERVIEW_MIN_WORDS}-${FREE_OVERVIEW_MAX_WORDS} từ.
- Viết dễ hiểu cho người lớn tuổi: câu ngắn, ý rõ, thuật ngữ tử vi phải giải thích ngay bằng lời đời thường.
- Mở đầu đánh đúng cảm giác tâm lý thật, không mở đầu bằng danh sách sao.
- Mỗi phần chỉ thêm một góc nhìn mới, không lặp ý, không đưa checklist How-to chi tiết.
- "Mỏ neo" dùng nhãn trạng thái trung lập, không dùng điểm số kiểu 35/100.
- Kết thúc bằng 4-6 câu hỏi What/Why để người đọc muốn mở hồ sơ chuyên sâu.

Markdown đúng thứ tự:
## Tín hiệu nổi bật của lá số
## Mỏ neo
## Điểm đáng chú ý nhất
## Khí chất và nội lực
## Công việc và tài chính
## Tình cảm và quan hệ
## Sức khỏe và nhịp sống
## Vận năm ${chart.input.viewYear}
## Câu hỏi mở trước khi đi sâu`;
}

function freeOverviewPreviewPrompt(chart: TuViChart) {
  const evidence = formatChartEvidence(buildChartEvidenceProfile(chart));
  const audience = freeOverviewAudienceContext(chart);
  const address = viewerAddress(chart);

  return `Bạn là chuyên gia Tử Vi viết lời mở đầu riêng cho ${chart.input.fullName}.

Hãy viết đúng ${FREE_OVERVIEW_PREVIEW_MIN_WORDS}-${FREE_OVERVIEW_PREVIEW_MAX_WORDS} từ tiếng Việt, không tiêu đề, không danh sách.
- Mở đầu bằng một quan sát tâm lý hoặc hoàn cảnh đủ cụ thể để người đọc thấy mình trong đó.
- Bám vào ít nhất hai dữ kiện lá số được cung cấp, nhưng chỉ nhắc tối đa hai thuật ngữ Tử Vi và giải thích ngay bằng lời đời thường.
- Xưng hô với người đọc là "${address}". Văn phong ấm, rõ, câu ngắn, dễ hiểu với người lớn tuổi.
- Điều chỉnh ví dụ theo giai đoạn: ${audience.lifeStage}. Ưu tiên ngôn ngữ về ${audience.workFocus}.
- Chỉ nói điều gì đang nổi bật và vì sao cần đọc sâu hơn. Không đưa checklist hoặc giải pháp đầy đủ.
- Không dùng điểm số, không hù dọa, không khẳng định số phận, không nhắc LLM/AI, không mời mua hàng.
- Kết bằng một câu tự nhiên cho biết bản đầy đủ đang tiếp tục làm rõ công việc, tài chính, tình cảm và vận năm.

Dữ liệu lá số:
${evidence}`;
}

export function buildInstantFreeOverview(chart: TuViChart) {
  return buildFreeOverviewFromInterpretationRules(chart);
}

export async function generateFreeOverview(chart: TuViChart) {
  const prompt = freeOverviewPrompt(chart);
  if (isLlmDisabledForSmoke()) return { content: buildInstantFreeOverview(chart), model: "template-fallback", prompt };
  if (!hasExternalLlmProvider()) return { content: buildInstantFreeOverview(chart), model: "template-fallback", prompt };

  const routed = await generateWithLlmRouter({
    prompt,
    maxTokens: FREE_OVERVIEW_MAX_TOKENS,
    temperature: 0.55,
    providerOrder: [...READING_PROVIDER_ORDER],
  });

  if (routed?.text?.trim()) return { content: routed.text.trim(), model: routed.model, prompt };

  const repairPrompt = freeOverviewRepairPrompt(chart);
  const repaired = await generateWithLlmRouter({
    prompt: repairPrompt,
    maxTokens: FREE_OVERVIEW_REPAIR_MAX_TOKENS,
    temperature: 0.5,
    providerOrder: ["deepseek"],
  });

  if (repaired?.text?.trim()) return { content: repaired.text.trim(), model: repaired.model, prompt: repairPrompt };

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
          "Viết như một bài tư vấn riêng cho cung đang mở. Giải thích cung/sao bằng lời đời thường, dễ hiểu cho người lớn tuổi, nhưng vẫn nêu bằng chứng tử vi khi cần. Tập trung vào ý nghĩa thực tế, điểm nên phát huy và điều cần tránh.",
        targetWords: "650-950 từ",
      },
      DAI_VAN: {
        title: "Luận giai đoạn đại vận",
        instruction:
          "Viết về giai đoạn 10 năm đang mở khóa: bối cảnh, cơ hội, áp lực và việc nên ưu tiên. Nói rõ đây là định hướng dài hạn, không kết luận cứng.",
        targetWords: "750-1100 từ",
      },
      TIEU_VAN: {
        title: "Luận tiểu vận",
        instruction:
          "Viết về năm đang mở khóa trong nền đại vận 10 năm: trọng tâm năm, cơ hội thực tế, áp lực cần chú ý, việc nên làm theo quý và cách đọc năm này trong bối cảnh dài hạn.",
        targetWords: "650-950 từ",
      },
      NGUYET_VAN: {
        title: "Luận nguyệt vận",
        instruction:
          "Viết về tháng đang mở khóa: trọng tâm tháng, công việc, tài chính, tình cảm/gia đình, sức khỏe/tinh thần và việc nên tránh. Bám vào dữ kiện lá số, sao lưu/vận hạn và lịch ngày nếu có.",
        targetWords: "500-800 từ",
      },
      NHAT_VAN: {
        title: "Luận nhật vận cá nhân hóa",
        instruction:
          "Viết về ngày đang xem theo lá số cá nhân: mức thuận lợi, việc hợp để làm, việc nên chậm lại, giờ/nhịp hành động nên ưu tiên. Giữ giọng mềm, thực tế, không hù dọa.",
        targetWords: "350-550 từ",
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
      requiredSections: ["Mỏ neo", "Luận giải chi tiết"],
      instruction: "Mở đầu báo cáo toàn bộ. Tóm tắt Mệnh, Thân, Cục, âm dương, cân lượng, đại vận hiện tại, lai nhân cung và các tín hiệu nổi bật nhất bằng lời dễ hiểu. Nhắc rõ 5 điểm định hướng chỉ là chỉ báo tham khảo.",
      targetWords: "550-800 từ",
    },
    {
      key: "menh-than",
      title: "Chương 2: Mệnh, Thân và khí chất cốt lõi",
      requiredSections: ["Mỏ neo", "Luận giải chi tiết"],
      instruction: "Phân tích Mệnh/Thân, chính tinh, phụ tinh, trạng thái Miếu/Vượng/Đắc/Bình/Hãm và dịch các tín hiệu này thành khí chất, cách ra quyết định, xu hướng trưởng thành trong đời sống.",
      targetWords: "650-950 từ",
    },
    {
      key: "twelve-palaces",
      title: "Chương 3: 12 cung trọng yếu",
      requiredSections: ["Mỏ neo", "Luận giải chi tiết"],
      instruction: "Luận đủ 12 cung nhưng không đi tuyến tính như từ điển. BẮT BUỘC nhóm thành các tiêu đề cấp 3: ### Trụ cột 1: Bản Thể & Sức Khỏe (Mệnh, Thân, Phúc Đức, Tật Ách); ### Trụ cột 2: Sự Nghiệp & Thịnh Vượng (Quan Lộc, Tài Bạch, Điền Trạch); ### Trụ cột 3: Mạng Lưới Mối Quan Hệ (Phu Thê, Tử Tức, Phụ Mẫu, Nô Bộc, Huynh Đệ). Viết theo tính chiến lược, không liệt kê từng cung máy móc.",
      targetWords: "850-1200 từ",
    },
    {
      key: "career",
      title: "Chương 4: Công việc và định hướng sự nghiệp",
      requiredSections: ["Mỏ neo", "Luận giải chi tiết"],
      instruction: "Luận về khuynh hướng nghề nghiệp, cách làm việc, môi trường phù hợp, cơ hội tiến lên, cách giảm áp lực và điểm cần tránh trong năm xem.",
      targetWords: "600-900 từ",
    },
    {
      key: "money",
      title: "Chương 5: Tài chính và cách quản trị tiền bạc",
      requiredSections: ["Mỏ neo", "Luận giải chi tiết"],
      instruction: "Luận về tiền bạc, thói quen tích lũy, rủi ro chi tiêu/đầu tư, cách kiểm soát nợ và cách quyết định tài chính thận trọng.",
      targetWords: "550-850 từ",
    },
    {
      key: "relationship",
      title: "Chương 6: Tình cảm, hôn nhân, gia đình",
      requiredSections: ["Mỏ neo", "Luận giải chi tiết"],
      instruction: "Luận về quan hệ gia đình, hôn nhân, cách giao tiếp, cảm xúc, trách nhiệm và cách giữ hòa khí. Không phán cứng chuyện ly hợp hay mất mát.",
      targetWords: "450-700 từ",
    },
    {
      key: "health",
      title: "Chương 7: Sức khỏe, tinh thần, nhịp sống",
      requiredSections: ["Mỏ neo", "Luận giải chi tiết"],
      instruction: "Luận về nhịp nghỉ ngơi, sức khỏe tinh thần, dấu hiệu quá tải, thói quen nên điều chỉnh. Ghi rõ không thay thế tư vấn y tế chuyên môn.",
      targetWords: "400-650 từ",
    },
    {
      key: "yearly-months",
      title: `Chương 8: Vận hạn năm ${year} và gợi ý theo từng tháng`,
      requiredSections: ["Mỏ neo", "Luận giải chi tiết"],
      instruction: `Tổng hợp vận hạn năm ${year}, đại vận hiện tại, sao lưu niên và lời khuyên hành động. BẮT BUỘC biến 12 tháng thành bản đồ nhịp từng tháng. Mỗi tháng bắt đầu bằng dòng "### Tháng X: [trạng thái ngắn]"; bên dưới tách rõ "🔻 Điểm cần chậm lại" và "🔹 Việc nên tận dụng". Mỗi tháng nêu trọng tâm, việc nên ưu tiên, việc nên tránh, lưu ý cảm xúc/sức khỏe/tài chính nếu cần.`,
      targetWords: "900-1300 từ",
    },
    {
      key: "action-plan",
      title: "Chương 9: Kế hoạch hành động cá nhân",
      requiredSections: ["Việc cần ưu tiên ngay", "Kế hoạch 30 ngày", "Kế hoạch 90 ngày", "Điều cần tránh", "Mốc tự đánh giá lại"],
      instruction: "Tổng hợp các kết luận của tám chương trước thành kế hoạch cụ thể. Không luận giải lại, không lặp ý; mỗi hành động bắt đầu bằng động từ và có mốc thực hiện hoặc tiêu chí tự kiểm tra.",
      targetWords: "450-700 từ",
    },
  ];
}

export async function generateFreeOverviewPreview(chart: TuViChart) {
  const prompt = freeOverviewPreviewPrompt(chart);
  if (isLlmDisabledForSmoke()) return { content: "", model: "llm-disabled", prompt };
  const routed = await generateWithLlmRouter({
    prompt,
    maxTokens: FREE_OVERVIEW_PREVIEW_MAX_TOKENS,
    temperature: 0.55,
    providerOrder: [...READING_PROVIDER_ORDER],
  });
  if (routed) return { content: routed.text.trim(), model: routed.model, prompt };
  return { content: "", model: "llm-unavailable", prompt };
}

function paidReadingQualityRules() {
  return `Khung chất lượng bắt buộc cho bài trả phí:
- Viết cho người lớn tuổi và người trưởng thành: câu ngắn, ý rõ, mỗi đoạn 2-4 câu. Đọc xong hiểu ngay mình nên chú ý điều gì.
- tránh từ chuyên môn khi không cần. Nếu có thể nói "giữ tiền", đừng viết "quản trị dòng tiền"; nếu có thể nói "đi chậm lại", đừng viết "chiến lược phòng thủ".
- mỗi thuật ngữ tử vi phải được giải thích ngay bằng lời đời thường. Ví dụ: Tuần/Triệt là dấu hiệu việc dễ bị chậm hoặc phải kiểm tra lại; Hóa Lộc là tín hiệu có lộc/cơ hội nếu biết giữ nhịp.
- Mỗi luận điểm quan trọng phải gắn với một tình huống cụ thể trong đời sống, ví dụ cách làm việc, cách giữ tiền, cách chọn người hợp tác, kiểu xung đột dễ gặp hoặc phản ứng tâm lý khi bị áp lực.
- Với mỗi nét nổi bật, nói rõ mặt giúp ích và mặt cần giữ chừng mực. Không dừng lại ở mô tả tốt/xấu.
- Với báo cáo FULL, chỉ chương Kế hoạch hành động cá nhân tổng hợp việc nên làm và nên tránh; với phần mở khóa đơn lẻ, đặt hành động trong mục Gợi ý nên làm.
- Ẩn giàn giáo dữ liệu: không bê nguyên bảng sao dài vào thân bài; chỉ gọi tên sao/cung ngay trong dòng luận khi nó làm rõ một kết luận.
- Chống lặp ý: không lặp lại cùng một nhận định giữa các chương. Nếu phải nhắc lại một tín hiệu cũ, hãy đổi góc nhìn sang quyết định mới, rủi ro mới hoặc việc cần chú ý khác.
- Mỏ neo - Độ sâu: tám chương luận giải phải có nhãn tóm tắt/score để đọc nhanh và phần luận giải sâu để chứng minh giá trị; không chèn cẩm nang hành động riêng.
- Điểm nhấn: mỗi chương luận giải phải có 2-4 kết luận quan trọng viết bằng Markdown **in đậm**; chỉ in đậm cụm hoặc câu then chốt, không in đậm nguyên đoạn dài.
- Tinh gọn: giữ ý chính, bỏ đoạn dẫn dài, không kéo dài chỉ để đủ chữ.
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
- Viết theo hướng dễ làm theo: người đọc nên ưu tiên gì trước, nên trì hoãn gì, dấu hiệu nào cần theo dõi lại.
- Nếu có rủi ro, hãy chuyển thành việc cụ thể: đi chậm lại, kiểm tra giấy tờ/tiền bạc/sức khỏe/quan hệ, đặt mốc xem lại.
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
    const targetWords = paidReadingUpperTargetWords(chapter, 1200);
    return Math.min(PAID_READING_CHAPTER_MAX_TOKENS, Math.max(2600, Math.ceil(targetWords * 2.8)));
  }
  if (type === "DAI_VAN") return 3600;
  if (type === "PALACE" || type === "TIEU_VAN") return 3200;
  if (type === "NGUYET_VAN") return 2600;
  if (type === "NHAT_VAN") return 1800;

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
  actionContext = "",
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
  const actionContextBlock = chapter.key === "action-plan" && actionContext
    ? `\n\nKết luận đã chắt lọc từ tám chương trước, chỉ dùng để lập kế hoạch và không chép lại nguyên văn:\n${actionContext}`
    : "";
  const fullFormatRules = chapter.key === "action-plan"
    ? `- Không tạo section dữ kiện và không nhắc lại bảng sao như một log kỹ thuật.
- Đây là chương hành động duy nhất; tổng hợp và ưu tiên, không luận giải lại.
- Trong cả năm phần, dùng bullet bắt đầu bằng động từ mạnh như "Thiết lập", "Giảm", "Từ chối", "Kiểm tra", "Ưu tiên", "Thanh lý"; mỗi bullet có mốc thời gian hoặc tiêu chí kiểm tra.`
    : `- Không tạo section dữ kiện và không nhắc lại bảng sao như một log kỹ thuật.
- Áp dụng phom Mỏ neo - Độ sâu cho chương này; không tạo Cẩm nang hành động riêng.
- Ở phần Mỏ neo: viết 1-3 dòng tóm tắt nhanh, có thể dùng nhãn trạng thái hoặc điểm số như "Tài chính: 52/100 - Cần đi chậm". Phần này phải thỏa mãn người đọc trong 3 giây đầu.
- Ở phần Luận giải chi tiết: vào thẳng luận giải. Chỉ gọi tên sao/cung ngay trong dòng văn khi cần chứng minh, có thể nêu trạng thái sao (M/V/Đ/B/H), ví dụ "Với Thiên Tướng gặp Địa Không, Địa Kiếp..."; không tạo danh sách dữ liệu.
- Đánh dấu 2-4 kết luận quan trọng bằng **in đậm**; không in đậm nguyên đoạn.`;
  const formatRules = isFullReport
    ? `${fullFormatRules}
- Nếu là chương 12 cung, bắt buộc dùng tiêu đề cấp 3 cho ba trụ cột chiến lược đã nêu trong trọng tâm nội dung.
- Nếu chương là vận năm, bắt buộc có đủ 12 tháng trong năm ${chart.input.viewYear}; mỗi tháng là một timeline card dạng "### Tháng X: [nhịp từng tháng]" và tách rõ "🔻 Điểm cần chậm lại" / "🔹 Việc nên tận dụng".`
    : `- Ở phần dữ kiện: chỉ ghi 3-5 bằng chứng tử vi mạnh nhất, có thể nêu trạng thái sao (M/V/Đ/B/H), nhưng không liệt kê giàn giáo dữ liệu dài. Mỗi bằng chứng phải có một câu diễn giải đời sống đi kèm.
- Ở phần luận giải: giải thích sâu bằng các tình huống cụ thể, nhưng mỗi đoạn tối đa 3-4 dòng khi đọc trên điện thoại.
- Ở phần lưu ý: mọi sao hãm, sát tinh, lưu sát tinh phải chuyển thành lời khuyên đi chậm, kiểm tra kỹ và giữ an toàn; không dọa, không kết luận tuyệt đối.
- Ở phần gợi ý: dùng ít nhất 3 bullet hành động rõ việc nên làm, nên tránh, nhịp kiểm tra lại.
- Nếu là vận năm hoặc nguyệt/nhật vận, hãy nêu trọng tâm thời gian đang mở khóa thật cụ thể.`;

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

${dataContext}${yearlyMonthContext}${actionContextBlock}

Yêu cầu bắt buộc:
- Chỉ viết ${unitName} này, không viết lan sang phạm vi khác.
- Viết như hồ sơ tư vấn riêng cho ${chart.input.fullName}; không viết như bài blog kiến thức chung.
- Mỗi kết luận quan trọng phải nối với ít nhất một bằng chứng cung, sao, trạng thái sao, Tuần/Triệt hoặc đại vận đã cấp.
- Phân tích rõ điểm mạnh, điểm yếu cần quản trị, cơ hội tài chính/đời sống và thời điểm rủi ro khi phù hợp với chương.
- Không tự tính lại lá số, không đổi ngày giờ, không tự thêm sao ngoài dữ liệu đã cấp.
- Không lặp lại lời chào ở đầu chương: chỉ Chương 1 được chào rất ngắn nếu thật cần, các chương 2-9 đi thẳng vào vấn đề.
- không tạo section dữ kiện, không mở đầu chương bằng mục dữ kiện, không tạo heading "Dữ kiện lá số đã dùng", "Dữ kiện tử vi đã dùng" hoặc "Dữ liệu kỹ thuật".
- không lặp lại cùng một nhận định giữa các chương. Nếu cùng một sao/cung đã được nhắc, hãy dùng nó để rút ra một quyết định, hành động hoặc cảnh báo khác.
- Tuyệt đối không được in lại nhãn nội bộ hoặc câu lệnh prompt như "Loại luận", "Phạm vi", "Chiến lược prompt", "Trọng tâm dữ liệu", "Trọng tâm nội dung", "Dữ liệu nổi bật", "Dữ liệu 12 cung", "Dữ liệu lá số JSON"; chỉ xuất bản văn hoàn chỉnh cho khách hàng.
- Nội dung phải tạo cảm giác an tâm, rõ ràng, đáng tiền cho người đọc 30-60 tuổi.
- Ưu tiên người lớn tuổi: câu ngắn, từ quen thuộc, mỗi đoạn 2-4 câu; đọc xong hiểu ngay mình nên chú ý điều gì.
- mỗi thuật ngữ tử vi phải được giải thích ngay bằng lời đời thường trong cùng câu hoặc câu kế tiếp.
- tránh từ chuyên môn khi không cần; nếu dùng được lời giản dị thì dùng lời giản dị.
- Tinh gọn: giữ ý chính, bỏ đoạn dẫn dài, không kéo dài chỉ để đủ chữ.
- BẮT BUỘC độ dài riêng phần này: ${chapter.targetWords}; không trả lời ngắn hơn mốc dưới của phạm vi này.
- Xưng hô tự nhiên theo dữ liệu: dùng "${summary.viewerAddress}" khi cần gọi trực tiếp người xem.
- Bắt đầu bằng đúng dòng Markdown: ${startLine}
- Phải có đúng các heading dưới đây, đúng thứ tự:
${sectionLines}
${formatRules}
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
  if (chapter.key === "action-plan") {
    return `# ${chapter.title}

## Việc cần ưu tiên ngay
- **Chọn một ưu tiên có tác động lớn nhất**, ghi rõ kết quả cần đạt và hoàn thành bước đầu trong 72 giờ.
- **Kiểm tra vùng rủi ro đang ảnh hưởng trực tiếp**, nhất là dòng tiền, giấy tờ, sức khỏe và cam kết quan trọng.

## Kế hoạch 30 ngày
- Thiết lập một mục tiêu chính, chia thành bốn mốc tuần và ghi lại kết quả vào cuối mỗi tuần.
- Giảm các việc không phục vụ mục tiêu chính; chỉ nhận thêm cam kết khi nguồn lực và người chịu trách nhiệm đã rõ.
- Kiểm tra quỹ dự phòng, lịch nghỉ và một cuộc trao đổi quan trọng trước ngày thứ 30.

## Kế hoạch 90 ngày
- Ưu tiên một thay đổi có thể đo lường trong công việc, tài chính hoặc quan hệ và đánh giá theo tháng.
- Mở rộng từng bước nhỏ sau khi mốc 30 ngày cho thấy tín hiệu ổn định; không đặt cược toàn bộ nguồn lực vào một quyết định.
- Tổng kết điều đã tạo kết quả, điều làm tiêu hao năng lượng và điều cần dừng ở cuối tháng thứ ba.

## Điều cần tránh
- Tránh quyết định lớn khi thông tin chưa đủ, cảm xúc đang cao hoặc trách nhiệm giữa các bên chưa được viết rõ.
- Từ chối lời mời mở rộng quá nhanh nếu dòng tiền, sức khỏe hoặc nền gia đình chưa ổn định.
- Không dùng luận giải này thay thế tư vấn chuyên môn về y tế, pháp lý hoặc đầu tư.

## Mốc tự đánh giá lại
- Rà soát sau 7 ngày để xác nhận bước khởi động đã được thực hiện.
- Rà soát sau 30 ngày để giữ việc hiệu quả và loại việc không còn phục vụ mục tiêu.
- Rà soát sau 90 ngày để quyết định tiếp tục, điều chỉnh hoặc dừng kế hoạch dựa trên kết quả thực tế.`;
  }
  const evidenceLines = fallbackEvidenceForChapter(chart, chapter, focusEvidence);
  const lead = fallbackChapterLead(chapter, summary.viewerAddress);
  const evidenceSentence = evidenceLines.slice(0, 3).join("; ");
  const scoreForChapter =
    chapter.key === "career"
      ? summary.scores.find((score) => score.key === "career")
      : chapter.key === "money"
        ? summary.scores.find((score) => score.key === "money")
        : chapter.key === "relationship"
          ? summary.scores.find((score) => score.key === "love")
          : chapter.key === "health"
            ? summary.scores.find((score) => score.key === "health")
            : chapter.key === "yearly-months"
              ? summary.scores.find((score) => score.key === "year")
              : undefined;
  const scoreLabel = scoreForChapter ? `${scoreForChapter.label}: ${scoreForChapter.value}/100` : `Tổng quan: ${summary.scores.map((score) => `${score.label} ${score.value}/100`).join(" · ")}`;
  const posture = scoreForChapter && scoreForChapter.value >= 70 ? "có điểm sáng để chủ động khai thác" : scoreForChapter && scoreForChapter.value < 50 ? "cần đi chậm và kiểm tra kỹ" : "cần tiến chậm, chọn việc chắc";
  const detailedBody =
    chapter.key === "twelve-palaces"
      ? `${lead}

### Trụ cột 1: Bản Thể & Sức Khỏe
Mệnh, Thân, Phúc Đức và Tật Ách được đọc như nền vận hành bên trong của ${summary.viewerAddress}. Với các tín hiệu như ${evidenceSentence}, phần quan trọng không phải là nhớ tên từng sao, mà là nhận ra lúc nào nên dùng sức bền, lúc nào nên nghỉ và lúc nào cần giảm áp lực.

### Trụ cột 2: Sự Nghiệp & Thịnh Vượng
Quan Lộc, Tài Bạch và Điền Trạch cho biết cách tạo giá trị, giữ tiền và xây nền ổn định. Khi sao tốt xuất hiện, hãy biến nó thành hệ thống làm việc; khi sao hãm hoặc sát tinh xuất hiện, hãy biến nó thành quy trình kiểm tra trước khi cam kết.

### Trụ cột 3: Mạng Lưới Mối Quan Hệ
Phu Thê, Tử Tức, Phụ Mẫu, Nô Bộc và Huynh Đệ nên được nhìn như mạng lưới nâng đỡ hoặc tiêu hao năng lượng. Trọng tâm là nói rõ kỳ vọng, chọn người đồng hành và tránh để im lặng biến thành hiểu nhầm.`
      : chapter.key === "yearly-months"
        ? `${lead}

Gợi ý 12 tháng trong năm ${chart.input.viewYear}:
${yearlyMonthGuidanceLines(chart)
  .map((line, index) => {
    const month = index + 1;
    const theme = MONTH_READING_THEMES[index];
    return `### Tháng ${month}: Nhịp tháng - ${theme}
🔻 Điểm cần chậm lại: tránh mở rộng cam kết khi thông tin chưa đủ rõ; đọc kỹ đoạn tham chiếu: ${line.replace(/^- Tháng \d+:\s*/, "")}
🔹 Việc nên tận dụng: chọn một việc ưu tiên có mốc kiểm tra rõ, giữ nhịp tiền bạc/sức khỏe/quan hệ ở mức có thể kiểm soát.`;
  })
  .join("\n\n")}`
        : `${lead}

Với các tín hiệu như ${evidenceSentence}, chương này không nên đọc như một danh sách sao. Ý nghĩa thực tế là xác định việc nên tiến, việc cần đi chậm và kiểu quyết định nên kiểm tra kỹ hơn.

Khi gặp sao hãm, sát tinh, Tuần/Triệt hoặc sao lưu gây áp lực, phần luận không biến thành lời phán cứng. Cách đọc hữu ích hơn là chuyển nó thành câu hỏi hành động: việc nào cần kiểm tra thêm, cam kết nào nên làm chậm lại, quan hệ nào cần nói rõ hơn, và nguồn lực nào cần giữ lại trước khi mở rộng.`;

  return `# ${chapter.title}

## Mỏ neo
**${scoreLabel} - ${posture}.** Chương này nên được đọc như một bản định hướng nhanh trước khi đi vào chi tiết: đâu là vùng nên dùng lực, đâu là vùng cần đặt rào chắn, và quyết định nào cần kiểm tra lại.

## Luận giải chi tiết
${detailedBody}

**Điểm cần giữ:** chọn một ưu tiên có thể kiểm chứng thay vì dàn trải nguồn lực.

**Điểm cần giữ chừng mực:** giảm tốc khi thông tin, trách nhiệm hoặc giới hạn rủi ro chưa rõ.`;
}

async function generatePaidChapter(prompt: string, maxTokens: number) {
  const routed = await generateWithLlmRouter({
    prompt,
    maxTokens,
    temperature: 0.48,
    providerOrder: [...READING_PROVIDER_ORDER],
  });
  if (routed) return { content: routed.text, model: routed.model };
  return null;
}
