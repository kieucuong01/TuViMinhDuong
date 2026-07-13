import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { unstable_cache } from "next/cache";
import { CHART_ENGINE_VERSION, generateTuViChart, type ChartInput, type TuViChart } from "@/lib/chart";
import { articleWithScore, seedArticles, type ArticleCategoryView, type ArticleView } from "@/lib/content";
import { getDb } from "@/lib/db";
import { FEATURE_PRICE_KEYS, FEATURE_PRICES, COIN_PACKAGES, type FeaturePriceMap, type ReadingKey } from "@/lib/pricing";
import { isReadingBundleKey, readingBundleScopeKey } from "@/lib/reading-bundles";
import {
  FREE_OVERVIEW_VERSION,
  buildInstantFreeOverview,
  countWords,
  isCompleteFreeOverview,
} from "@/lib/ai";
import { scoreArticleSeo } from "@/lib/seo";
import { slugify } from "@/lib/format";
import { MAIN_STARS, PALACES, SUPPORT_STARS, buildPseoInventory } from "@/lib/pseo-registry";
import type { SessionUser } from "@/lib/auth";
import { createPerfTimer, logPerfEvent } from "@/lib/perf";
import type { ReadingProgressInput } from "@/lib/reading-progress";

type StoredChart = {
  id: string;
  title: string;
  input: ChartInput;
  chart: TuViChart;
  userId?: string;
  creationIp?: string | null;
  creationUserAgent?: string | null;
  createdAt: Date;
};

export type ChartCreationMetadata = {
  requestIp?: string;
  userAgent?: string;
};

export type StoredReading = {
  id: string;
  userId: string;
  chartId: string;
  type: ReadingKey;
  scopeKey: string;
  status?: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  priceCoins: number;
  content: string;
  promptMeta?: unknown;
  model?: string | null;
  error?: string | null;
  createdAt: Date;
  updatedAt?: Date;
};

export type ReadingScopeKey = {
  type: ReadingKey;
  scopeKey: string;
};

export type OperationSettings = {
  paymentsEnabled: boolean;
  coinTopupEnabled: boolean;
  paidReadingsEnabled: boolean;
  updatedAt?: Date | null;
};

export type AdminPaymentSource = "coin_topup" | "quick_reading" | "other";

export type AdminRevenueMetrics = {
  totalPaidVnd: number;
  currentMonthPaidVnd: number;
  last30DaysPaidVnd: number;
  coinTopupPaidVnd: number;
  quickReadingPaidVnd: number;
  otherPaidVnd: number;
  paidOrders: number;
  pendingOrders: number;
  failedOrders: number;
  cancelledOrders: number;
  expiredOrders: number;
};

export type AdminRecentUser = {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  coinBalance: number;
  createdAt: Date;
  chartsCount: number;
  readingsCount: number;
  paidOrdersCount: number;
  totalPaidVnd: number;
  lastPaymentAt: Date | null;
};

export type AdminRecentPayment = {
  id: string;
  email: string;
  name: string | null;
  orderCode: string;
  amountVnd: number;
  coins: number;
  status: string;
  source: AdminPaymentSource;
  sourceLabel: string;
  createdAt: Date;
  paidAt: Date | null;
};

export type AdminBusinessDashboard = {
  revenue: AdminRevenueMetrics;
  recentUsers: AdminRecentUser[];
  recentPayments: AdminRecentPayment[];
};

export type AdminTrendPeriod = "day" | "week" | "month";

export type AdminTrendPoint = {
  label: string;
  start: Date;
  end: Date;
  newUsers: number;
  charts: number;
  cumulativeUsers: number;
  cumulativeCharts: number;
};

export type AdminTrendGroups = Record<AdminTrendPeriod, AdminTrendPoint[]>;

const ADMIN_TREND_PERIODS = new Set<AdminTrendPeriod>(["day", "week", "month"]);
const ADMIN_TREND_PERIOD_LIST: AdminTrendPeriod[] = ["day", "week", "month"];
const CORE_SITEMAP_URLS = 7;
const TRUST_SITEMAP_URLS = 4;

export function normalizeAdminTrendPeriod(value?: string | null): AdminTrendPeriod {
  return ADMIN_TREND_PERIODS.has(value as AdminTrendPeriod) ? (value as AdminTrendPeriod) : "day";
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const start = startOfDay(date);
  const day = start.getDay();
  start.setDate(start.getDate() - ((day + 6) % 7));
  return start;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addTrendPeriod(date: Date, period: AdminTrendPeriod, amount = 1) {
  const next = new Date(date);
  if (period === "day") next.setDate(next.getDate() + amount);
  if (period === "week") next.setDate(next.getDate() + amount * 7);
  if (period === "month") next.setMonth(next.getMonth() + amount);
  return next;
}

function trendLabel(date: Date, period: AdminTrendPeriod) {
  const twoDigits = (value: number) => String(value).padStart(2, "0");
  if (period === "month") {
    return `${twoDigits(date.getMonth() + 1)}/${String(date.getFullYear()).slice(-2)}`;
  }
  return `${twoDigits(date.getDate())}/${twoDigits(date.getMonth() + 1)}`;
}

function buildTrendBuckets(period: AdminTrendPeriod, now = new Date()) {
  const count = period === "day" ? 14 : 12;
  const currentStart = period === "day" ? startOfDay(now) : period === "week" ? startOfWeek(now) : startOfMonth(now);
  const firstStart = addTrendPeriod(currentStart, period, -(count - 1));
  return Array.from({ length: count }, (_, index) => {
    const start = addTrendPeriod(firstStart, period, index);
    const end = addTrendPeriod(start, period);
    return { label: trendLabel(start, period), start, end };
  });
}

function countDatesInRange(dates: Date[], start: Date, end: Date) {
  return dates.filter((date) => date >= start && date < end).length;
}

function isIndexableSitemapArticle(article: { slug: string; status?: string; robots?: string | null; canonicalUrl?: string | null }) {
  if (article.status && article.status !== "published") return false;
  if (String(article.robots || "").toLowerCase().includes("noindex")) return false;
  const canonical = String(article.canonicalUrl || "").trim();
  return !canonical || canonical === `/kien-thuc-tu-vi/${article.slug}` || canonical.endsWith(`/kien-thuc-tu-vi/${article.slug}`);
}

async function buildDbAdminTrends(db: NonNullable<ReturnType<typeof getDb>>, period: AdminTrendPeriod): Promise<AdminTrendPoint[]> {
  const buckets = buildTrendBuckets(period);
  const firstStart = buckets[0]?.start || startOfDay(new Date());
  const [baseUsers, baseCharts, newUsers, charts] = await Promise.all([
    db.user.count({ where: { createdAt: { lt: firstStart } } }),
    db.chart.count({ where: { createdAt: { lt: firstStart } } }),
    Promise.all(buckets.map((bucket) => db.user.count({ where: { createdAt: { gte: bucket.start, lt: bucket.end } } }))),
    Promise.all(buckets.map((bucket) => db.chart.count({ where: { createdAt: { gte: bucket.start, lt: bucket.end } } }))),
  ]);

  let cumulativeUsers = baseUsers;
  let cumulativeCharts = baseCharts;
  return buckets.map((bucket, index) => {
    cumulativeUsers += newUsers[index] || 0;
    cumulativeCharts += charts[index] || 0;
    return {
      ...bucket,
      newUsers: newUsers[index] || 0,
      charts: charts[index] || 0,
      cumulativeUsers,
      cumulativeCharts,
    };
  });
}

function buildDemoAdminTrends(period: AdminTrendPeriod): AdminTrendPoint[] {
  const buckets = buildTrendBuckets(period);
  const userDates = new Map<string, Date>();
  const chartDates: Date[] = [];
  for (const chart of charts().values()) {
    chartDates.push(chart.createdAt);
    if (chart.userId) {
      const existing = userDates.get(chart.userId);
      if (!existing || chart.createdAt < existing) userDates.set(chart.userId, chart.createdAt);
    }
  }
  const userDateList = Array.from(userDates.values());
  const firstStart = buckets[0]?.start || startOfDay(new Date());
  let cumulativeUsers = countDatesInRange(userDateList, new Date(0), firstStart);
  let cumulativeCharts = countDatesInRange(chartDates, new Date(0), firstStart);
  return buckets.map((bucket) => {
    const newUsers = countDatesInRange(userDateList, bucket.start, bucket.end);
    const chartCount = countDatesInRange(chartDates, bucket.start, bucket.end);
    cumulativeUsers += newUsers;
    cumulativeCharts += chartCount;
    return {
      ...bucket,
      newUsers,
      charts: chartCount,
      cumulativeUsers,
      cumulativeCharts,
    };
  });
}

async function buildDbAdminTrendGroups(db: NonNullable<ReturnType<typeof getDb>>): Promise<AdminTrendGroups> {
  const entries = await Promise.all(
    ADMIN_TREND_PERIOD_LIST.map(async (period) => [period, await buildDbAdminTrends(db, period)] as const),
  );
  return Object.fromEntries(entries) as AdminTrendGroups;
}

function buildDemoAdminTrendGroups(): AdminTrendGroups {
  return Object.fromEntries(
    ADMIN_TREND_PERIOD_LIST.map((period) => [period, buildDemoAdminTrends(period)]),
  ) as AdminTrendGroups;
}

export type StoredReadingProgress = ReadingProgressInput & {
  id: string;
  userId: string;
  readingId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminChartSubmission = {
  id: string;
  title: string;
  createdAt: Date;
  submitterType: "guest" | "user";
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  fullName: string;
  gender: ChartInput["gender"];
  calendarType: ChartInput["calendarType"];
  day: number;
  month: number;
  year: number;
  birthHour: number;
  birthMinute: number;
  viewYear: number;
  timezone: string;
  creationIp: string | null;
  creationUserAgent: string | null;
};

type ChartWithFreeOverview = TuViChart & {
  freeOverview?: {
    content: string;
    model: string;
    generatedAt: string;
    version?: string;
  };
  freeOverviewJob?: {
    status: "PENDING" | "COMPLETED" | "FAILED";
    startedAt: string;
    updatedAt: string;
    version?: string;
    error?: string;
  };
};

export type FreeOverviewStatus =
  | {
      status: "ready";
      content: string;
      source: "ai-cache";
      model: string;
      generatedAt: string;
      wordCount: number;
      jobStatus: "completed";
    }
  | {
      status: "fallback";
      content: string;
      source: "template-fallback";
      wordCount: number;
      jobStatus: "idle" | "processing" | "stale" | "failed";
      error?: string;
    };

export type FreeOverviewGenerationClaim =
  | { status: "ready"; overview: Extract<FreeOverviewStatus, { status: "ready" }> }
  | { status: "processing"; overview: Extract<FreeOverviewStatus, { status: "fallback" }> }
  | { status: "claimed" };

type ArticleRecord = Omit<ArticleView, "faqs"> & {
  faqs?: unknown;
};

const ARTICLE_UPLOAD_DIR = path.join(process.cwd(), "public", "articles");
const ARTICLE_UPLOAD_PUBLIC_PATH = "/articles";
const ARTICLE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const ARTICLE_UPLOAD_TYPES: Record<string, { extension: string; signatures: number[][] }> = {
  "image/jpeg": { extension: "jpg", signatures: [[0xff, 0xd8, 0xff]] },
  "image/png": { extension: "png", signatures: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
  "image/webp": { extension: "webp", signatures: [[0x52, 0x49, 0x46, 0x46]] },
};

const DELETED_ARTICLE_STATUS = "deleted";
export const OPERATION_SETTINGS_CACHE_TAG = "operation-settings";
export const FEATURE_PRICES_CACHE_TAG = "feature-prices";
export const ARTICLES_CACHE_TAG = "articles";
const FREE_OVERVIEW_JOB_STALE_MS = 90_000;

export type ChartHistoryItem = StoredChart & {
  hasAdvancedReading: boolean;
  advancedReadingId?: string;
};

const globalStore = globalThis as unknown as {
  demoCharts?: Map<string, StoredChart>;
  demoReadings?: Map<string, StoredReading>;
  demoReadingProgress?: Map<string, StoredReadingProgress>;
  demoBalances?: Map<string, number>;
  demoArticles?: Map<string, ArticleView>;
  demoArticleCategories?: Map<string, ArticleCategoryView>;
  demoOperationSettings?: OperationSettings;
  demoFeaturePrices?: FeaturePriceMap;
};

export const DEFAULT_OPERATION_SETTINGS: OperationSettings = {
  paymentsEnabled: true,
  coinTopupEnabled: true,
  paidReadingsEnabled: true,
  updatedAt: null,
};

const seedArticleCategories: ArticleCategoryView[] = [
  { id: "cat-nhap-mon", name: "Nhập môn tử vi", slug: "nhap-mon-tu-vi", description: "Bài nền tảng cho người mới bắt đầu đọc lá số." },
  { id: "cat-12-cung", name: "12 cung", slug: "12-cung", description: "Kiến thức về từng cung trong lá số tử vi." },
  { id: "cat-van-han", name: "Vận hạn", slug: "van-han", description: "Đại vận, tiểu vận, nguyệt vận và nhịp vận theo thời gian." },
];

function charts() {
  globalStore.demoCharts ||= new Map();
  return globalStore.demoCharts;
}

function readings() {
  globalStore.demoReadings ||= new Map();
  return globalStore.demoReadings;
}

function balances() {
  globalStore.demoBalances ||= new Map();
  return globalStore.demoBalances;
}

function demoArticles() {
  globalStore.demoArticles ||= new Map(seedArticles.map((article) => [article.slug, articleWithScore(article)]));
  return globalStore.demoArticles;
}

function demoArticleCategories() {
  globalStore.demoArticleCategories ||= new Map(seedArticleCategories.map((category) => [category.id, category]));
  return globalStore.demoArticleCategories;
}

function demoOperationSettings() {
  globalStore.demoOperationSettings ||= { ...DEFAULT_OPERATION_SETTINGS };
  return globalStore.demoOperationSettings;
}

function cloneDefaultFeaturePrices(): FeaturePriceMap {
  return Object.fromEntries(
    FEATURE_PRICE_KEYS.map((key) => [key, { ...FEATURE_PRICES[key] }]),
  ) as FeaturePriceMap;
}

function demoFeaturePrices() {
  globalStore.demoFeaturePrices ||= cloneDefaultFeaturePrices();
  return globalStore.demoFeaturePrices;
}

function normalizeFeaturePriceMap(rows: Array<{ key: string; label: string; priceCoins: number; isActive?: boolean | null }> = []): FeaturePriceMap {
  const rowMap = new Map(rows.map((row) => [row.key, row]));
  return Object.fromEntries(
    FEATURE_PRICE_KEYS.map((key) => {
      const fallback = FEATURE_PRICES[key];
      const row = rowMap.get(key);
      if (!row?.isActive) return [key, { ...fallback }];
      return [key, { label: row.label || fallback.label, priceCoins: row.priceCoins }];
    }),
  ) as FeaturePriceMap;
}

function normalizeFeaturePriceUpdates(updates: Array<{ key: string; priceCoins: number }>) {
  return updates.map((item) => {
    if (!FEATURE_PRICE_KEYS.includes(item.key as ReadingKey)) throw new Error("INVALID_PRICE_KEY");
    const key = item.key as ReadingKey;
    const priceCoins = Number(item.priceCoins);
    if (!Number.isInteger(priceCoins) || priceCoins < 0 || priceCoins > 999999) throw new Error("INVALID_PRICE");
    return { key, label: FEATURE_PRICES[key].label, priceCoins };
  });
}

function normalizeOperationSettings(row?: Partial<OperationSettings> | null): OperationSettings {
  return {
    paymentsEnabled: row?.paymentsEnabled ?? DEFAULT_OPERATION_SETTINGS.paymentsEnabled,
    coinTopupEnabled: row?.coinTopupEnabled ?? DEFAULT_OPERATION_SETTINGS.coinTopupEnabled,
    paidReadingsEnabled: row?.paidReadingsEnabled ?? DEFAULT_OPERATION_SETTINGS.paidReadingsEnabled,
    updatedAt: row?.updatedAt ?? null,
  };
}

type AdminPaymentRecord = {
  id: string;
  orderCode: bigint | number | string;
  amountVnd: number;
  coins: number;
  status: string;
  packageId?: string | null;
  rawPayload?: unknown;
  createdAt: Date;
  paidAt?: Date | null;
  user?: {
    email: string;
    name: string | null;
  } | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function readingProgressEntries() {
  globalStore.demoReadingProgress ||= new Map();
  return globalStore.demoReadingProgress;
}

function numberFromRecord(record: Record<string, unknown>, key: string, fallback: number) {
  const value = record[key];
  const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function normalizeAdminChartInput(input: unknown): ChartInput {
  const record = isRecord(input) ? input : {};
  const gender = record.gender === "female" ? "female" : "male";
  const calendarType = record.calendarType === "lunar" ? "lunar" : "solar";
  return {
    fullName: String(record.fullName || "Chưa nhập tên"),
    gender,
    calendarType,
    day: numberFromRecord(record, "day", 1),
    month: numberFromRecord(record, "month", 1),
    year: numberFromRecord(record, "year", 1990),
    birthHour: numberFromRecord(record, "birthHour", 0),
    birthMinute: numberFromRecord(record, "birthMinute", 0),
    viewYear: numberFromRecord(record, "viewYear", new Date().getFullYear()),
    timezone: String(record.timezone || "Asia/Bangkok"),
  };
}

type AdminChartSubmissionRecord = {
  id: string;
  title: string;
  input: unknown;
  userId?: string | null;
  creationIp?: string | null;
  creationUserAgent?: string | null;
  createdAt: Date;
  user?: {
    id?: string;
    email: string;
    name: string | null;
  } | null;
};

function normalizeAdminChartSubmission(record: AdminChartSubmissionRecord): AdminChartSubmission {
  const input = normalizeAdminChartInput(record.input);
  const userId = record.userId || record.user?.id || null;
  return {
    id: record.id,
    title: record.title,
    createdAt: new Date(record.createdAt),
    submitterType: userId ? "user" : "guest",
    userId,
    userEmail: record.user?.email || null,
    userName: record.user?.name || null,
    fullName: input.fullName,
    gender: input.gender,
    calendarType: input.calendarType,
    day: input.day,
    month: input.month,
    year: input.year,
    birthHour: input.birthHour,
    birthMinute: input.birthMinute || 0,
    viewYear: input.viewYear,
    timezone: input.timezone || "Asia/Bangkok",
    creationIp: record.creationIp || null,
    creationUserAgent: record.creationUserAgent || null,
  };
}

function paymentDate(payment: Pick<AdminPaymentRecord, "paidAt" | "createdAt">) {
  return payment.paidAt ? new Date(payment.paidAt) : new Date(payment.createdAt);
}

function paymentSource(payment: Pick<AdminPaymentRecord, "rawPayload" | "packageId" | "coins">): AdminPaymentSource {
  if (isRecord(payment.rawPayload) && "quickReading" in payment.rawPayload) return "quick_reading";
  if (payment.packageId || payment.coins > 0) return "coin_topup";
  return "other";
}

function paymentSourceLabel(source: AdminPaymentSource) {
  if (source === "quick_reading") return "Luận giải nhanh";
  if (source === "coin_topup") return "Nạp xu";
  return "Khác";
}

function emptyRevenueMetrics(): AdminRevenueMetrics {
  return {
    totalPaidVnd: 0,
    currentMonthPaidVnd: 0,
    last30DaysPaidVnd: 0,
    coinTopupPaidVnd: 0,
    quickReadingPaidVnd: 0,
    otherPaidVnd: 0,
    paidOrders: 0,
    pendingOrders: 0,
    failedOrders: 0,
    cancelledOrders: 0,
    expiredOrders: 0,
  };
}

function summarizeRevenue(payments: AdminPaymentRecord[]): AdminRevenueMetrics {
  const revenue = emptyRevenueMetrics();
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const last30DaysStart = new Date(now);
  last30DaysStart.setDate(now.getDate() - 30);

  for (const payment of payments) {
    if (payment.status === "PENDING") revenue.pendingOrders += 1;
    if (payment.status === "FAILED") revenue.failedOrders += 1;
    if (payment.status === "CANCELLED") revenue.cancelledOrders += 1;
    if (payment.status === "EXPIRED") revenue.expiredOrders += 1;
    if (payment.status !== "PAID") continue;

    revenue.paidOrders += 1;
    revenue.totalPaidVnd += payment.amountVnd;

    const paidDate = paymentDate(payment);
    if (paidDate >= currentMonthStart) revenue.currentMonthPaidVnd += payment.amountVnd;
    if (paidDate >= last30DaysStart) revenue.last30DaysPaidVnd += payment.amountVnd;

    const source = paymentSource(payment);
    if (source === "quick_reading") revenue.quickReadingPaidVnd += payment.amountVnd;
    else if (source === "coin_topup") revenue.coinTopupPaidVnd += payment.amountVnd;
    else revenue.otherPaidVnd += payment.amountVnd;
  }

  return revenue;
}

function normalizeRecentPayment(payment: AdminPaymentRecord): AdminRecentPayment {
  const source = paymentSource(payment);
  return {
    id: payment.id,
    email: payment.user?.email || "Chưa có email",
    name: payment.user?.name || null,
    orderCode: String(payment.orderCode),
    amountVnd: payment.amountVnd,
    coins: payment.coins,
    status: payment.status,
    source,
    sourceLabel: paymentSourceLabel(source),
    createdAt: new Date(payment.createdAt),
    paidAt: payment.paidAt ? new Date(payment.paidAt) : null,
  };
}

function articleSortValue(article: ArticleView) {
  return article.updatedAt?.getTime() || article.publishedAt?.getTime() || 0;
}

function sortArticlesNewestFirst(articles: ArticleView[]) {
  return articles.sort((a, b) => articleSortValue(b) - articleSortValue(a));
}

function articleStatusFromForm(formData: FormData) {
  const status = String(formData.get("status") || "published");
  return status === "draft" || status === "archived" ? status : "published";
}

function normalizeFaqs(value: unknown): { question: string; answer: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as { question?: unknown; answer?: unknown };
      const question = String(record.question || "").trim();
      const answer = String(record.answer || "").trim();
      return question && answer ? { question, answer } : null;
    })
    .filter(Boolean) as { question: string; answer: string }[];
}

function faqsFromForm(formData: FormData) {
  const questions = formData.getAll("faqQuestion[]").map((item) => String(item || "").trim());
  const answers = formData.getAll("faqAnswer[]").map((item) => String(item || "").trim());
  return questions
    .map((question, index) => ({ question, answer: answers[index] || "" }))
    .filter((item) => item.question && item.answer)
    .slice(0, 8);
}

function hasByteSignature(bytes: Uint8Array, signatures: number[][]) {
  return signatures.some((signature) => signature.every((byte, index) => bytes[index] === byte));
}

function isFileUpload(value: FormDataEntryValue | null): value is File {
  return Boolean(
    value &&
      typeof value === "object" &&
      "arrayBuffer" in value &&
      typeof value.arrayBuffer === "function" &&
      "size" in value &&
      typeof value.size === "number" &&
      "type" in value &&
      typeof value.type === "string",
  );
}

function uploadExtensionForFile(file: File, bytes: Uint8Array) {
  const uploadType = ARTICLE_UPLOAD_TYPES[file.type];
  if (!uploadType) {
    throw new Error("Chi ho tro upload anh JPEG, PNG hoac WebP.");
  }

  if (!hasByteSignature(bytes, uploadType.signatures)) {
    throw new Error("File anh khong dung dinh dang da chon.");
  }

  if (file.type === "image/webp") {
    const riffType = new TextDecoder().decode(bytes.slice(8, 12));
    if (riffType !== "WEBP") throw new Error("File anh khong dung dinh dang da chon.");
  }

  return uploadType.extension;
}

async function articleCoverImageFromForm(formData: FormData, slug: string) {
  const fallbackImage = String(formData.get("coverImage") || "").trim() || "/og-default.svg";
  const upload = formData.get("coverImageFile");
  if (!isFileUpload(upload) || upload.size === 0) return fallbackImage;

  if (upload.size > ARTICLE_UPLOAD_MAX_BYTES) {
    throw new Error("Anh dai dien toi da 5MB.");
  }

  const bytes = new Uint8Array(await upload.arrayBuffer());
  const extension = uploadExtensionForFile(upload, bytes);
  const safeSlug = slug || `article-${Date.now()}`;
  const fileName = `${safeSlug}-${randomUUID()}.${extension}`;

  await mkdir(ARTICLE_UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(ARTICLE_UPLOAD_DIR, fileName), bytes);
  return `${ARTICLE_UPLOAD_PUBLIC_PATH}/${fileName}`;
}

function articleWithNormalizedRelations(article: ArticleRecord): ArticleView {
  return articleWithScore({
    ...article,
    faqs: normalizeFaqs(article.faqs),
    category: article.category || null,
  });
}

function fresherSeedArticle(slug: string, candidateUpdatedAt?: Date | null) {
  const seed = seedArticles.find((article) => article.slug === slug);
  if (!seed) return null;

  const normalizedSeed = articleWithNormalizedRelations(seed);
  const seedUpdatedAt = normalizedSeed.updatedAt?.getTime() || normalizedSeed.publishedAt?.getTime() || 0;
  const candidateTime = candidateUpdatedAt?.getTime() || 0;

  return seedUpdatedAt > candidateTime ? normalizedSeed : null;
}

function usesInMemoryUser(userId: string) {
  return userId.startsWith("demo-") || userId.startsWith("guest-");
}

function chartTitle(chart: TuViChart) {
  return `${chart.input.fullName} - ${chart.canChi.year}`;
}

function chartInputKey(input: ChartInput) {
  return [
    input.fullName.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, ""),
    input.gender,
    input.calendarType,
    input.day,
    input.month,
    input.year,
    input.birthHour,
    input.birthMinute || 0,
    input.viewYear,
    input.timezone || "Asia/Bangkok",
  ].join("|");
}

async function findPurchasedDuplicateChart(user: SessionUser | null, input: ChartInput) {
  if (!user) return null;
  const inputKey = chartInputKey(input);
  const db = getDb();

  if (!db || usesInMemoryUser(user.id)) {
    const purchasedChartIds = new Set(
      Array.from(readings().values())
        .filter(
          (reading) =>
            reading.userId === user.id &&
            reading.type === "FULL" &&
            reading.scopeKey === "all" &&
            (reading.status ?? "COMPLETED") === "COMPLETED",
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((reading) => reading.chartId),
    );

    for (const chartId of purchasedChartIds) {
      const chart = charts().get(chartId);
      if (!chart || chart.userId !== user.id || chartInputKey(chart.input) !== inputKey) continue;
      return upgradeStoredChart(chart);
    }
    return null;
  }

  const purchasedReadings = await db.reading.findMany({
    where: { userId: user.id, type: "FULL", scopeKey: "all", status: "COMPLETED" },
    select: {
      chart: {
        select: {
          id: true,
          title: true,
          input: true,
          chart: true,
          userId: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const duplicate = purchasedReadings
    .map((reading) => reading.chart)
    .find((candidate) => candidate && chartInputKey(candidate.input as ChartInput) === inputKey);
  if (!duplicate) return null;

  return upgradeStoredChart({
    id: duplicate.id,
    title: duplicate.title,
    input: duplicate.input as ChartInput,
    chart: duplicate.chart as TuViChart,
    userId: duplicate.userId || undefined,
    createdAt: duplicate.createdAt,
  });
}

function shouldRegenerateChartPayload(chart: TuViChart | null | undefined) {
  if (!chart) return true;
  if (chart.engine?.version !== CHART_ENGINE_VERSION) return true;
  if (chart.engine?.starProfile !== "tracuutuvi-compatible") return true;
  if (!chart.laiNhan || chart.laiNhan === "Đang cập nhật") return true;
  if (!chart.boneWeight?.label || chart.boneWeight.label === "Đang cập nhật") return true;
  if (!Array.isArray(chart.palaces) || chart.palaces.length !== 12) return true;

  const yearlyStars = chart.palaces.flatMap((palace) => palace.yearlyStars || []);
  if (yearlyStars.some((star) => star.startsWith("L.Hóa"))) return true;
  if (yearlyStars.some((star) => /\s\([MVĐBH]\)$/.test(star))) return true;

  return false;
}

function upgradeStoredChart(record: StoredChart) {
  if (!shouldRegenerateChartPayload(record.chart)) return record;
  const sourceInput = { ...(record.chart?.input || {}), ...record.input } as ChartInput;
  const chart = generateTuViChart(sourceInput);
  return {
    ...record,
    title: chartTitle(chart),
    input: chart.input,
    chart,
  };
}

export async function countRecentChartsForIp(requestIp: string | undefined, since: Date) {
  if (!requestIp) return 0;
  const db = getDb();
  if (!db) {
    return Array.from(charts().values()).filter((chart) => chart.creationIp === requestIp && chart.createdAt >= since).length;
  }
  return db.chart.count({
    where: {
      creationIp: requestIp,
      createdAt: { gte: since },
    },
  });
}

export async function saveChart(input: ChartInput, user: SessionUser | null, metadata: ChartCreationMetadata = {}) {
  const timer = createPerfTimer();
  const chart = await timer.time("engine", () => generateTuViChart(input));
  const title = chartTitle(chart);
  const db = getDb();
  const duplicate = await timer.time("duplicateLookup", () => findPurchasedDuplicateChart(user, chart.input));
  if (duplicate) {
    logPerfEvent("save_chart_timing", timer.total(), {
      hasUser: Boolean(user),
      result: "duplicate",
      timings: timer.timings(),
    });
    return duplicate;
  }

  if (!db) {
    const id = `demo-chart-${Date.now()}`;
    const stored = {
      id,
      title,
      input: chart.input,
      chart,
      userId: user?.id,
      creationIp: metadata.requestIp,
      creationUserAgent: metadata.userAgent,
      createdAt: new Date(),
    };
    charts().set(id, stored);
    logPerfEvent("save_chart_timing", timer.total(), {
      hasUser: Boolean(user),
      result: "demo-created",
      timings: timer.timings(),
    });
    return stored;
  }

  const created = await timer.time("dbCreate", () =>
    db.chart.create({
      data: {
        title,
        input: chart.input,
        chart,
        userId: user?.id,
        isPrivate: true,
        creationIp: metadata.requestIp,
        creationUserAgent: metadata.userAgent,
      },
    }),
  );
  const stored = {
    id: created.id,
    title: created.title,
    input: created.input as ChartInput,
    chart: created.chart as TuViChart,
    userId: created.userId || undefined,
    creationIp: created.creationIp || undefined,
    creationUserAgent: created.creationUserAgent || undefined,
    createdAt: created.createdAt,
  };
  logPerfEvent("save_chart_timing", timer.total(), {
    hasUser: Boolean(user),
    result: "created",
    timings: timer.timings(),
  });
  return stored;
}

function chartIdFromChartPath(path: string) {
  const [withoutHash] = path.split("#");
  const [pathname] = withoutHash.split("?");
  const match = /^\/la-so\/([^/?#]+)$/.exec(pathname);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export async function claimGuestChartForUserFromPath(path: string, user: SessionUser) {
  const chartId = chartIdFromChartPath(path);
  if (!chartId) return false;

  const db = getDb();
  if (!db || usesInMemoryUser(user.id)) {
    const chart = charts().get(chartId);
    if (!chart || chart.userId) return false;
    charts().set(chartId, { ...chart, userId: user.id });
    return true;
  }

  const updated = await db.chart.updateMany({
    where: { id: chartId, userId: null },
    data: { userId: user.id },
  });
  return updated.count > 0;
}

export async function getChart(id: string) {
  const db = getDb();
  if (!db) {
    const chart = charts().get(id) || null;
    if (!chart) return null;
    const upgraded = upgradeStoredChart(chart);
    if (upgraded !== chart) charts().set(id, upgraded);
    return upgraded;
  }
  const chart = await db.chart.findUnique({ where: { id } });
  if (!chart) return null;
  const stored = {
    id: chart.id,
    title: chart.title,
    input: chart.input as ChartInput,
    chart: chart.chart as TuViChart,
    userId: chart.userId || undefined,
    createdAt: chart.createdAt,
  };
  const upgraded = upgradeStoredChart(stored);
  if (upgraded !== stored) {
    await db.chart.update({
      where: { id },
      data: {
        title: upgraded.title,
        input: upgraded.input,
        chart: upgraded.chart,
      },
    });
  }
  return upgraded;
}

async function updateStoredChartPayload(chartId: string, chart: TuViChart) {
  const db = getDb();
  if (!db) {
    const record = charts().get(chartId);
    if (record) charts().set(chartId, { ...record, chart });
    return;
  }

  await db.chart.update({
    where: { id: chartId },
    data: { chart },
  });
}

function isFreshFreeOverviewJob(job: ChartWithFreeOverview["freeOverviewJob"]) {
  if (!job?.startedAt) return false;
  const startedAt = Date.parse(job.startedAt);
  return Number.isFinite(startedAt) && Date.now() - startedAt < FREE_OVERVIEW_JOB_STALE_MS;
}

export function getFreeOverviewStatus(chart: TuViChart): FreeOverviewStatus {
  const chartWithOverview = chart as ChartWithFreeOverview;
  if (
    chartWithOverview.freeOverview?.content &&
    chartWithOverview.freeOverview.version === FREE_OVERVIEW_VERSION &&
    isCompleteFreeOverview(chartWithOverview.freeOverview.content)
  ) {
    return {
      status: "ready",
      content: chartWithOverview.freeOverview.content,
      source: "ai-cache",
      model: chartWithOverview.freeOverview.model,
      generatedAt: chartWithOverview.freeOverview.generatedAt,
      wordCount: countWords(chartWithOverview.freeOverview.content),
      jobStatus: "completed",
    };
  }

  const job = chartWithOverview.freeOverviewJob;
  const hasCurrentJobVersion = job?.version === FREE_OVERVIEW_VERSION;
  const jobStatus =
    hasCurrentJobVersion && job?.status === "PENDING" && isFreshFreeOverviewJob(job)
      ? "processing"
      : hasCurrentJobVersion && job?.status === "PENDING"
        ? "stale"
        : hasCurrentJobVersion && job?.status === "FAILED"
          ? "failed"
          : "idle";

  const fallbackContent = buildInstantFreeOverview(chart);

  return {
    status: "fallback",
    content: fallbackContent,
    source: "template-fallback",
    wordCount: countWords(fallbackContent),
    jobStatus,
    ...(jobStatus === "failed" && job?.error ? { error: job.error } : {}),
  };
}

export async function claimFreeOverviewGeneration(chartId: string, chart: TuViChart): Promise<FreeOverviewGenerationClaim> {
  const current = getFreeOverviewStatus(chart);
  if (current.status === "ready") return { status: "ready", overview: current };
  if (current.jobStatus === "processing") return { status: "processing", overview: current };

  const now = new Date().toISOString();
  const nextChart: ChartWithFreeOverview = {
    ...chart,
    freeOverviewJob: {
      status: "PENDING",
      startedAt: now,
      updatedAt: now,
      version: FREE_OVERVIEW_VERSION,
    },
  };

  await updateStoredChartPayload(chartId, nextChart);
  return { status: "claimed" };
}

export async function failFreeOverviewGeneration(chartId: string, error: string) {
  const record = await getChart(chartId);
  if (!record) return null;
  const chartWithOverview = record.chart as ChartWithFreeOverview;
  const now = new Date().toISOString();
  const nextChart: ChartWithFreeOverview = {
    ...record.chart,
    freeOverviewJob: {
      status: "FAILED",
      startedAt: chartWithOverview.freeOverviewJob?.startedAt || now,
      updatedAt: now,
      version: FREE_OVERVIEW_VERSION,
      error,
    },
  };
  await updateStoredChartPayload(chartId, nextChart);
  return getFreeOverviewStatus(nextChart);
}

export async function generateAndStoreFreeOverview(chartId: string) {
  const record = await getChart(chartId);
  if (!record) throw new Error("Khong tim thay la so.");

  const current = getFreeOverviewStatus(record.chart);
  if (current.status === "ready") return current;

  const { generateFreeOverview } = await import("@/lib/ai");
  const fullOverviewPromise = generateFreeOverview(record.chart);

  const result = await fullOverviewPromise;
  if (result.model.includes("template-fallback")) {
    const message = "LLM tong quan chua san sang, dang tiep tuc dung ban template.";
    await failFreeOverviewGeneration(chartId, message);
    throw new Error(message);
  }
  if (!isCompleteFreeOverview(result.content)) {
    const message = "Ban AI tong quan chua du do dai hoac thieu muc can thiet.";
    await failFreeOverviewGeneration(chartId, message);
    throw new Error(message);
  }

  const latestRecord = await getChart(chartId);
  if (!latestRecord) throw new Error("Khong tim thay la so khi luu ban tong quan AI.");
  const now = new Date().toISOString();
  const updatedChart: ChartWithFreeOverview = {
    ...latestRecord.chart,
    freeOverview: {
      content: result.content,
      model: result.model,
      generatedAt: now,
      version: FREE_OVERVIEW_VERSION,
    },
    freeOverviewJob: {
      status: "COMPLETED",
      startedAt: (latestRecord.chart as ChartWithFreeOverview).freeOverviewJob?.startedAt || now,
      updatedAt: now,
      version: FREE_OVERVIEW_VERSION,
    },
  };

  await updateStoredChartPayload(chartId, updatedChart);
  const ready = getFreeOverviewStatus(updatedChart);
  if (ready.status !== "ready") throw new Error("Chua luu duoc ban tong quan AI.");
  return ready;
}

export async function getOrCreateFreeOverview(chartId: string, chart: TuViChart) {
  const current = getFreeOverviewStatus(chart);
  if (current.status === "ready") return current.content;
  const generated = await generateAndStoreFreeOverview(chartId);
  return generated.content;
}

export async function listUserCharts(userId: string, includeAll = false): Promise<ChartHistoryItem[]> {
  const db = getDb();
  if (!db || usesInMemoryUser(userId)) {
    const userCharts = Array.from(charts().values())
      .map((chart) => {
        const upgraded = upgradeStoredChart(chart);
        if (upgraded !== chart) charts().set(chart.id, upgraded);
        return upgraded;
      })
      .filter((chart) => includeAll || chart.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return userCharts.map((chart) => {
      const advanced = Array.from(readings().values()).find(
        (reading) =>
          (includeAll || reading.userId === userId) &&
          reading.chartId === chart.id &&
          reading.type === "FULL" &&
          reading.scopeKey === "all" &&
          (reading.status ?? "COMPLETED") === "COMPLETED",
      );
      return {
        ...chart,
        hasAdvancedReading: Boolean(advanced),
        advancedReadingId: advanced?.id,
      };
    });
  }

  const userCharts = await db.chart.findMany({
    where: includeAll ? {} : { userId },
    include: {
      readings: {
        where: { ...(includeAll ? {} : { userId }), type: "FULL", scopeKey: "all", status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return userCharts.map((chart) => {
    const upgraded = upgradeStoredChart({
      id: chart.id,
      title: chart.title,
      input: chart.input as ChartInput,
      chart: chart.chart as TuViChart,
      userId: chart.userId || undefined,
      createdAt: chart.createdAt,
    });
    return {
      ...upgraded,
      hasAdvancedReading: chart.readings.length > 0,
      advancedReadingId: chart.readings[0]?.id,
    };
  });
}

export async function deleteUserChart(user: SessionUser, chartId: string) {
  const db = getDb();
  if (!db || usesInMemoryUser(user.id)) {
    const chart = charts().get(chartId);
    if (!chart || (user.role !== "ADMIN" && chart.userId !== user.id)) return false;
    charts().delete(chartId);
    for (const [key, reading] of readings()) {
      if (reading.chartId === chartId) readings().delete(key);
    }
    return true;
  }

  const chart = await db.chart.findUnique({ where: { id: chartId }, select: { userId: true } });
  if (!chart || (user.role !== "ADMIN" && chart.userId !== user.id)) return false;
  await db.chart.delete({ where: { id: chartId } });
  return true;
}

export async function getFeaturePrice(type: ReadingKey) {
  const prices = await getFeaturePrices();
  return prices[type];
}

function cacheServerData<T extends (...args: never[]) => Promise<unknown>>(
  reader: T,
  keyParts: string[],
  options: { tags: string[]; revalidate: number },
) {
  if (process.env.NODE_ENV === "test") return reader;
  return unstable_cache(reader as unknown as Parameters<typeof unstable_cache>[0], keyParts, options) as unknown as T;
}

async function readFeaturePricesFromDb(): Promise<FeaturePriceMap> {
  const db = getDb();
  if (!db) return demoFeaturePrices();
  const prices = await db.featurePrice.findMany();
  return normalizeFeaturePriceMap(prices);
}

const getCachedFeaturePricesFromDb = cacheServerData(readFeaturePricesFromDb, [FEATURE_PRICES_CACHE_TAG], {
  tags: [FEATURE_PRICES_CACHE_TAG],
  revalidate: 300,
});

export async function getFeaturePrices(): Promise<FeaturePriceMap> {
  if (!getDb()) return demoFeaturePrices();
  return getCachedFeaturePricesFromDb();
}

export async function updateFeaturePrices(updates: Array<{ key: string; priceCoins: number }>) {
  const normalized = normalizeFeaturePriceUpdates(updates);
  const db = getDb();

  if (!db) {
    const next = { ...demoFeaturePrices() };
    for (const item of normalized) {
      next[item.key] = { label: item.label, priceCoins: item.priceCoins };
    }
    globalStore.demoFeaturePrices = next;
    return next;
  }

  await db.$transaction(
    normalized.map((item) =>
      db.featurePrice.upsert({
        where: { key: item.key },
        update: { label: item.label, priceCoins: item.priceCoins, isActive: true },
        create: { key: item.key, label: item.label, priceCoins: item.priceCoins, isActive: true },
      }),
    ),
  );

  return readFeaturePricesFromDb();
}

async function readOperationSettingsFromDb(): Promise<OperationSettings> {
  const db = getDb();
  if (!db) return demoOperationSettings();

  try {
    const rows = await db.$queryRaw<
      Array<{
        paymentsEnabled: boolean;
        coinTopupEnabled: boolean;
        paidReadingsEnabled: boolean;
        updatedAt: Date | null;
      }>
    >`SELECT "paymentsEnabled", "coinTopupEnabled", "paidReadingsEnabled", "updatedAt" FROM "OperationSettings" WHERE "id" = 'global' LIMIT 1`;

    return normalizeOperationSettings(rows[0]);
  } catch {
    return DEFAULT_OPERATION_SETTINGS;
  }
}

const getCachedOperationSettingsFromDb = cacheServerData(readOperationSettingsFromDb, [OPERATION_SETTINGS_CACHE_TAG], {
  tags: [OPERATION_SETTINGS_CACHE_TAG],
  revalidate: 300,
});

export async function getOperationSettings(): Promise<OperationSettings> {
  if (!getDb()) return demoOperationSettings();
  return getCachedOperationSettingsFromDb();
}

export async function updateOperationSettings(settings: Omit<OperationSettings, "updatedAt">) {
  const next = normalizeOperationSettings(settings);
  const db = getDb();
  if (!db) {
    globalStore.demoOperationSettings = { ...next, updatedAt: new Date() };
    return globalStore.demoOperationSettings;
  }

  await db.$executeRaw`
    INSERT INTO "OperationSettings" ("id", "paymentsEnabled", "coinTopupEnabled", "paidReadingsEnabled")
    VALUES ('global', ${next.paymentsEnabled}, ${next.coinTopupEnabled}, ${next.paidReadingsEnabled})
    ON CONFLICT ("id") DO UPDATE SET
      "paymentsEnabled" = EXCLUDED."paymentsEnabled",
      "coinTopupEnabled" = EXCLUDED."coinTopupEnabled",
      "paidReadingsEnabled" = EXCLUDED."paidReadingsEnabled",
      "updatedAt" = CURRENT_TIMESTAMP
  `;

  return readOperationSettingsFromDb();
}

export async function getUserBalance(user: SessionUser) {
  const db = getDb();
  if (!db || usesInMemoryUser(user.id)) {
    const map = balances();
    if (!map.has(user.id)) map.set(user.id, user.coinBalance);
    return map.get(user.id) || 0;
  }
  const fresh = await db.user.findUnique({ where: { id: user.id }, select: { coinBalance: true } });
  return fresh?.coinBalance ?? 0;
}

export async function adjustCoins(user: SessionUser, amount: number, reason: string, referenceId?: string) {
  const db = getDb();
  if (!db || usesInMemoryUser(user.id)) {
    const map = balances();
    const balance = (map.get(user.id) ?? user.coinBalance) + amount;
    map.set(user.id, balance);
    return balance;
  }

  const updated = await db.$transaction(async (tx) => {
    const current = await tx.user.findUniqueOrThrow({ where: { id: user.id }, select: { coinBalance: true } });
    const balance = current.coinBalance + amount;
    if (balance < 0) throw new Error("Số dư xu không đủ.");
    await tx.user.update({ where: { id: user.id }, data: { coinBalance: balance } });
    await tx.coinLedger.create({
      data: {
        userId: user.id,
        type: amount >= 0 ? "CREDIT" : "DEBIT",
        amount,
        balance,
        reason,
        referenceId,
      },
    });
    return balance;
  });
  return updated;
}

export async function getCachedReading(userId: string, chartId: string, type: ReadingKey, scopeKey: string) {
  const db = getDb();
  if (!db || usesInMemoryUser(userId)) {
    const reading = readings().get(`${userId}:${chartId}:${type}:${scopeKey}`) || null;
    return reading && (reading.status ?? "COMPLETED") === "COMPLETED" && reading.content ? reading : null;
  }
  const reading = await db.reading.findUnique({
    where: { userId_chartId_type_scopeKey: { userId, chartId, type, scopeKey } },
  });
  return reading?.status === "COMPLETED" && reading.content
    ? {
        id: reading.id,
        userId,
        chartId,
        type,
        scopeKey,
        priceCoins: reading.priceCoins,
        content: reading.content,
        createdAt: reading.createdAt,
      }
    : null;
}

export async function hasReadingBundleAccess(user: SessionUser, chartId: string, type: ReadingKey) {
  if (user.role === "ADMIN") return true;
  if (!isReadingBundleKey(type)) return false;
  return Boolean(await getCachedReading(user.id, chartId, type, readingBundleScopeKey(type)));
}

export async function getAnyCompletedReading(chartId: string, type: ReadingKey, scopeKey: string) {
  const db = getDb();
  if (!db) {
    return Array.from(readings().values()).find(
      (reading) =>
        reading.chartId === chartId &&
        reading.type === type &&
        reading.scopeKey === scopeKey &&
        (reading.status ?? "COMPLETED") === "COMPLETED" &&
        reading.content,
    ) || null;
  }
  const reading = await db.reading.findFirst({
    where: { chartId, type, scopeKey, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
  });
  return reading?.content
    ? storedReadingFromDb(reading)
    : null;
}

function readingMapKey(type: ReadingKey, scopeKey: string) {
  return `${type}:${scopeKey}`;
}

function storedReadingFromDb(reading: {
  id: string;
  userId: string;
  chartId: string;
  type: string;
  scopeKey: string;
  status: string;
  priceCoins: number;
  content: string | null;
  promptMeta?: unknown;
  model?: string | null;
  error?: string | null;
  createdAt: Date;
  updatedAt?: Date;
}): StoredReading {
  return {
    id: reading.id,
    userId: reading.userId,
    chartId: reading.chartId,
    type: reading.type as ReadingKey,
    scopeKey: reading.scopeKey,
    status: reading.status as StoredReading["status"],
    priceCoins: reading.priceCoins,
    content: reading.content || "",
    promptMeta: reading.promptMeta,
    model: reading.model,
    error: reading.error,
    createdAt: reading.createdAt,
    updatedAt: reading.updatedAt,
  };
}

function updateDemoReadingById(readingId: string, patch: Partial<StoredReading>) {
  for (const [key, reading] of readings()) {
    if (reading.id !== readingId) continue;
    const updated = { ...reading, ...patch, updatedAt: new Date() };
    readings().set(key, updated);
    return updated;
  }
  return null;
}

export async function getReadingJobByScope(userId: string, chartId: string, type: ReadingKey, scopeKey: string) {
  const db = getDb();
  if (!db || usesInMemoryUser(userId)) return readings().get(`${userId}:${chartId}:${type}:${scopeKey}`) || null;
  const reading = await db.reading.findUnique({
    where: { userId_chartId_type_scopeKey: { userId, chartId, type, scopeKey } },
  });
  return reading ? storedReadingFromDb(reading) : null;
}

export async function getReadingJobById(userId: string, readingId: string) {
  const db = getDb();
  if (!db || usesInMemoryUser(userId)) {
    return Array.from(readings().values()).find((reading) => reading.id === readingId && reading.userId === userId) || null;
  }
  const reading = await db.reading.findFirst({ where: { id: readingId, userId } });
  return reading ? storedReadingFromDb(reading) : null;
}

function isMissingReadingProgressTable(error: unknown) {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "P2021",
  );
}

export async function getReadingProgress(userId: string, readingId: string): Promise<StoredReadingProgress | null> {
  const key = `${userId}:${readingId}`;
  const db = getDb();
  if (!db || usesInMemoryUser(userId)) return readingProgressEntries().get(key) || null;

  try {
    return await db.readingProgress.findUnique({
      where: { userId_readingId: { userId, readingId } },
    });
  } catch (error) {
    if (isMissingReadingProgressTable(error)) return null;
    throw error;
  }
}

export async function saveReadingProgress(
  userId: string,
  readingId: string,
  input: ReadingProgressInput,
): Promise<StoredReadingProgress> {
  const key = `${userId}:${readingId}`;
  const db = getDb();
  if (!db || usesInMemoryUser(userId)) {
    const existing = readingProgressEntries().get(key);
    const now = new Date();
    const progress: StoredReadingProgress = {
      id: existing?.id || `demo-progress-${Date.now()}`,
      userId,
      readingId,
      ...input,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    readingProgressEntries().set(key, progress);
    return progress;
  }

  return db.readingProgress.upsert({
    where: { userId_readingId: { userId, readingId } },
    update: input,
    create: { userId, readingId, ...input },
  });
}

export async function createPendingReading(
  user: SessionUser,
  chartId: string,
  type: ReadingKey,
  scopeKey: string,
  priceCoins: number,
  promptMeta?: unknown,
) {
  const db = getDb();
  if (!db || usesInMemoryUser(user.id)) {
    const key = `${user.id}:${chartId}:${type}:${scopeKey}`;
    const existing = readings().get(key);
    const reading: StoredReading = {
      id: existing?.id || `demo-reading-${Date.now()}`,
      userId: user.id,
      chartId,
      type,
      scopeKey,
      status: "PENDING",
      priceCoins,
      content: "",
      promptMeta,
      model: null,
      error: null,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    readings().set(key, reading);
    return reading;
  }

  const saved = await db.reading.upsert({
    where: { userId_chartId_type_scopeKey: { userId: user.id, chartId, type, scopeKey } },
    update: {
      status: "PENDING",
      content: "",
      priceCoins,
      promptMeta: promptMeta || undefined,
      model: null,
      error: null,
    },
    create: {
      userId: user.id,
      chartId,
      type,
      scopeKey,
      priceCoins,
      status: "PENDING",
      content: "",
      promptMeta: promptMeta || undefined,
      model: null,
      error: null,
    },
  });
  return storedReadingFromDb(saved);
}

export async function updateReadingJobProgress(readingId: string, content: string, promptMeta?: unknown, model?: string) {
  const demoUpdated = updateDemoReadingById(readingId, { status: "PENDING", content, promptMeta, model: model || null, error: null });
  if (demoUpdated) return demoUpdated;
  const db = getDb();
  if (!db) return null;
  const saved = await db.reading.update({
    where: { id: readingId },
    data: {
      status: "PENDING",
      content,
      promptMeta: promptMeta || undefined,
      model: model || undefined,
      error: null,
    },
  });
  return storedReadingFromDb(saved);
}

export async function completeReadingJob(readingId: string, content: string, promptMeta?: unknown, model?: string) {
  const demoUpdated = updateDemoReadingById(readingId, { status: "COMPLETED", content, promptMeta, model: model || null, error: null });
  if (demoUpdated) return demoUpdated;
  const db = getDb();
  if (!db) return null;
  const saved = await db.reading.update({
    where: { id: readingId },
    data: {
      status: "COMPLETED",
      content,
      promptMeta: promptMeta || undefined,
      model: model || undefined,
      error: null,
    },
  });
  return storedReadingFromDb(saved);
}

export async function failReadingJob(readingId: string, error: string, refunded = false, promptMeta?: unknown) {
  const status = refunded ? "REFUNDED" : "FAILED";
  const demoUpdated = updateDemoReadingById(readingId, { status, error, promptMeta });
  if (demoUpdated) return demoUpdated;
  const db = getDb();
  if (!db) return null;
  const saved = await db.reading.update({
    where: { id: readingId },
    data: {
      status,
      error,
      promptMeta: promptMeta || undefined,
    },
  });
  return storedReadingFromDb(saved);
}

export async function getCompletedReadingsForScopes(user: SessionUser | null, chartId: string, keys: ReadingScopeKey[]) {
  const result = new Map<string, StoredReading>();
  const uniqueKeys = Array.from(new Map(keys.map((key) => [readingMapKey(key.type, key.scopeKey), key])).values());
  if (!user || uniqueKeys.length === 0) return result;

  const db = getDb();
  if (!db || usesInMemoryUser(user.id)) {
    const candidates = Array.from(readings().values())
      .filter((reading) => {
        if (reading.chartId !== chartId) return false;
        if (user.role !== "ADMIN" && reading.userId !== user.id) return false;
        if ((reading.status ?? "COMPLETED") !== "COMPLETED" || !reading.content) return false;
        return uniqueKeys.some((key) => key.type === reading.type && key.scopeKey === reading.scopeKey);
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    for (const reading of candidates) {
      const key = readingMapKey(reading.type, reading.scopeKey);
      if (!result.has(key)) result.set(key, reading);
    }
    return result;
  }

  const rows = await db.reading.findMany({
    where: {
      chartId,
      status: "COMPLETED",
      content: { not: null },
      ...(user.role === "ADMIN" ? {} : { userId: user.id }),
      OR: uniqueKeys.map((key) => ({ type: key.type, scopeKey: key.scopeKey })),
    },
    orderBy: { createdAt: "desc" },
  });

  for (const reading of rows) {
    if (!reading.content) continue;
    const key = readingMapKey(reading.type as ReadingKey, reading.scopeKey);
    if (result.has(key)) continue;
    result.set(key, {
      id: reading.id,
      userId: reading.userId,
      chartId: reading.chartId,
      type: reading.type as ReadingKey,
      scopeKey: reading.scopeKey,
      priceCoins: reading.priceCoins,
      content: reading.content,
      createdAt: reading.createdAt,
    });
  }

  return result;
}

export async function getReadingById(userId: string, readingId: string) {
  const db = getDb();
  if (!db || usesInMemoryUser(userId)) {
    const reading = Array.from(readings().values()).find((item) => item.id === readingId && item.userId === userId) || null;
    return reading && (reading.status ?? "COMPLETED") === "COMPLETED" && reading.content ? reading : null;
  }
  const reading = await db.reading.findFirst({ where: { id: readingId, userId } });
  return reading?.status === "COMPLETED" && reading.content
    ? {
        id: reading.id,
        userId,
        chartId: reading.chartId,
        type: reading.type as ReadingKey,
        scopeKey: reading.scopeKey,
        priceCoins: reading.priceCoins,
        content: reading.content,
        createdAt: reading.createdAt,
      }
    : null;
}

export async function saveReading(
  user: SessionUser,
  chartId: string,
  type: ReadingKey,
  scopeKey: string,
  priceCoins: number,
  content: string,
  promptMeta?: unknown,
) {
  const db = getDb();
  if (!db || usesInMemoryUser(user.id)) {
    const id = `demo-reading-${Date.now()}`;
    const reading = {
      id,
      userId: user.id,
      chartId,
      type,
      scopeKey,
      status: "COMPLETED" as const,
      priceCoins,
      content,
      promptMeta,
      model: process.env.AI_MODEL || "template-fallback",
      error: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    readings().set(`${user.id}:${chartId}:${type}:${scopeKey}`, reading);
    return reading;
  }

  const saved = await db.reading.upsert({
    where: { userId_chartId_type_scopeKey: { userId: user.id, chartId, type, scopeKey } },
    update: {
      status: "COMPLETED",
      content,
      priceCoins,
      promptMeta: promptMeta || undefined,
      model: process.env.AI_MODEL || "template-fallback",
    },
    create: {
      userId: user.id,
      chartId,
      type,
      scopeKey,
      priceCoins,
      status: "COMPLETED",
      content,
      promptMeta: promptMeta || undefined,
      model: process.env.AI_MODEL || "template-fallback",
    },
  });
  return {
    id: saved.id,
    userId: saved.userId,
    chartId: saved.chartId,
    type,
    scopeKey,
    priceCoins: saved.priceCoins,
    content: saved.content || "",
    createdAt: saved.createdAt,
  };
}

async function readArticlesFromDb() {
  const db = getDb();
  if (!db) return sortArticlesNewestFirst(Array.from(demoArticles().values()).filter((article) => article.status === "published").map(articleWithNormalizedRelations));
  let articles: ArticleRecord[] = [];
  try {
    articles = (await db.article.findMany({
      where: { status: { in: ["published", DELETED_ARTICLE_STATUS] } },
      include: { category: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    })) as unknown as ArticleRecord[];
  } catch {
    return sortArticlesNewestFirst(seedArticles.map(articleWithNormalizedRelations));
  }
  const bySlug = new Map(seedArticles.map((article) => [article.slug, articleWithNormalizedRelations(article)]));
  for (const article of articles) {
    if (article.status === DELETED_ARTICLE_STATUS) {
      bySlug.delete(article.slug);
      continue;
    }
    const fresherSeed = fresherSeedArticle(article.slug, article.updatedAt || article.publishedAt);
    if (fresherSeed) {
      bySlug.set(article.slug, fresherSeed);
      continue;
    }
    bySlug.set(article.slug, articleWithNormalizedRelations(article));
  }
  return sortArticlesNewestFirst(Array.from(bySlug.values()));
}

const getCachedArticlesFromDb = cacheServerData(readArticlesFromDb, [ARTICLES_CACHE_TAG, "list"], {
  tags: [ARTICLES_CACHE_TAG],
  revalidate: 300,
});

export async function listArticles() {
  if (!getDb()) return readArticlesFromDb();
  return getCachedArticlesFromDb();
}

export async function listAdminArticles() {
  const db = getDb();
  if (!db) return sortArticlesNewestFirst(Array.from(demoArticles().values()).map(articleWithNormalizedRelations));
  try {
    const articles = (await db.article.findMany({
      include: { category: true },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    })) as unknown as ArticleRecord[];
    const bySlug = new Map(seedArticles.map((article) => [article.slug, articleWithNormalizedRelations(article)]));
    for (const article of articles) {
      if (article.status === DELETED_ARTICLE_STATUS) {
        bySlug.delete(article.slug);
        continue;
      }
      const fresherSeed = fresherSeedArticle(article.slug, article.updatedAt || article.publishedAt);
      if (fresherSeed) {
        bySlug.set(article.slug, fresherSeed);
        continue;
      }
      bySlug.set(article.slug, articleWithNormalizedRelations(article));
    }
    return sortArticlesNewestFirst(Array.from(bySlug.values()));
  } catch {
    return sortArticlesNewestFirst(seedArticles.map(articleWithNormalizedRelations));
  }
}

async function readArticleBySlugFromDb(slug: string) {
  const db = getDb();
  if (!db) {
    const article = demoArticles().get(slug);
    return article?.status === "published" ? articleWithNormalizedRelations(article) : null;
  }
  try {
    const article = await db.article.findUnique({ where: { slug }, include: { category: true } });
    if (article) {
      const fresherSeed = fresherSeedArticle(article.slug, article.updatedAt || article.publishedAt);
      if (fresherSeed) return fresherSeed;
      const scored = articleWithNormalizedRelations(article as unknown as ArticleRecord);
      return scored.status === "published" ? scored : null;
    }
    return seedArticles.map(articleWithNormalizedRelations).find((item) => item.slug === slug) || null;
  } catch {
    return seedArticles.map(articleWithNormalizedRelations).find((item) => item.slug === slug) || null;
  }
}

const getCachedArticleBySlugFromDb = cacheServerData(readArticleBySlugFromDb, [ARTICLES_CACHE_TAG, "slug"], {
  tags: [ARTICLES_CACHE_TAG],
  revalidate: 300,
});

export async function getArticleBySlug(slug: string) {
  if (!getDb()) return readArticleBySlugFromDb(slug);
  return getCachedArticleBySlugFromDb(slug);
}

export async function getAdminArticleBySlug(slug: string) {
  const db = getDb();
  if (!db) {
    const article = demoArticles().get(slug);
    return article ? articleWithNormalizedRelations(article) : null;
  }
  try {
    const article = await db.article.findUnique({ where: { slug }, include: { category: true } });
    if (article?.status === DELETED_ARTICLE_STATUS) return null;
    if (article) {
      const fresherSeed = fresherSeedArticle(article.slug, article.updatedAt || article.publishedAt);
      if (fresherSeed) return fresherSeed;
      return articleWithNormalizedRelations(article as unknown as ArticleRecord);
    }
    return seedArticles.map(articleWithNormalizedRelations).find((item) => item.slug === slug) || null;
  } catch {
    return seedArticles.map(articleWithNormalizedRelations).find((item) => item.slug === slug) || null;
  }
}

export async function deleteArticleBySlug(slug: string) {
  const normalizedSlug = slugify(slug);
  if (!normalizedSlug) return false;

  const db = getDb();
  if (!db) {
    return demoArticles().delete(normalizedSlug);
  }

  const existing = await db.article.findUnique({ where: { slug: normalizedSlug } });
  if (existing) {
    await db.article.update({
      where: { id: existing.id },
      data: {
        status: DELETED_ARTICLE_STATUS,
        publishedAt: null,
        robots: "noindex,nofollow",
      },
    });
    return true;
  }

  const seed = seedArticles.find((article) => article.slug === normalizedSlug);
  if (!seed) return false;

  await db.article.create({
    data: {
      title: seed.title,
      slug: seed.slug,
      excerpt: seed.excerpt,
      content: seed.content,
      status: DELETED_ARTICLE_STATUS,
      coverImage: seed.coverImage,
      coverAlt: seed.coverAlt,
      focusKeyword: seed.focusKeyword,
      metaTitle: seed.metaTitle,
      metaDescription: seed.metaDescription,
      canonicalUrl: seed.canonicalUrl,
      robots: "noindex,nofollow",
      ogImage: seed.ogImage,
      ogTitle: seed.ogTitle,
      ogDescription: seed.ogDescription,
      schemaType: seed.schemaType || "Article",
      faqs: seed.faqs || [],
      seoScore: seed.seoScore || 0,
      seoChecklist: seed.seoChecklist || [],
      publishedAt: null,
    },
  });
  return true;
}

async function readArticleCategoriesFromDb() {
  const db = getDb();
  if (!db) return Array.from(demoArticleCategories().values()).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  try {
    return (await db.articleCategory.findMany({ orderBy: { name: "asc" } })) as ArticleCategoryView[];
  } catch {
    return Array.from(demoArticleCategories().values()).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }
}

const getCachedArticleCategoriesFromDb = cacheServerData(readArticleCategoriesFromDb, [ARTICLES_CACHE_TAG, "categories"], {
  tags: [ARTICLES_CACHE_TAG],
  revalidate: 300,
});

export async function listArticleCategories() {
  if (!getDb()) return readArticleCategoriesFromDb();
  return getCachedArticleCategoriesFromDb();
}

export async function saveArticleCategoryFromForm(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const slug = slugify(String(formData.get("slug") || name));
  const description = String(formData.get("description") || "").trim();
  const originalCategoryId = String(formData.get("originalCategoryId") || "");
  const category: ArticleCategoryView = {
    id: originalCategoryId || `cat-${slug}`,
    name,
    slug,
    description,
  };

  const db = getDb();
  if (!db) {
    demoArticleCategories().set(category.id, category);
    return category;
  }

  const existing = originalCategoryId ? await db.articleCategory.findUnique({ where: { id: originalCategoryId } }) : null;
  const saved = existing
    ? await db.articleCategory.update({ where: { id: originalCategoryId }, data: { name, slug, description } })
    : await db.articleCategory.upsert({
        where: { slug },
        update: { name, description },
        create: { name, slug, description },
      });
  return saved as ArticleCategoryView;
}

export async function saveArticleFromForm(formData: FormData) {
  const title = String(formData.get("title") || "");
  const content = String(formData.get("content") || "");
  const excerpt = String(formData.get("excerpt") || "");
  const focusKeyword = String(formData.get("focusKeyword") || "");
  const slug = slugify(String(formData.get("slug") || title));
  const originalSlug = slugify(String(formData.get("originalSlug") || slug));
  const status = articleStatusFromForm(formData);
  const categoryId = String(formData.get("categoryId") || "") || null;
  const category = categoryId ? demoArticleCategories().get(categoryId) || null : null;
  const faqs = faqsFromForm(formData);
  const metaTitle = String(formData.get("metaTitle") || title);
  const metaDescription = String(formData.get("metaDescription") || excerpt);
  const canonicalUrl = String(formData.get("canonicalUrl") || `/kien-thuc-tu-vi/${slug}`);
  const coverImage = await articleCoverImageFromForm(formData, slug);
  const coverAlt = String(formData.get("coverAlt") || "");
  const db = getDb();
  const existingDemoArticle = !db ? demoArticles().get(originalSlug) || demoArticles().get(slug) || null : null;
  const existing = db ? await db.article.findUnique({ where: { slug: originalSlug || slug } }) : null;
  const existingPublishedAt = existing?.publishedAt || existingDemoArticle?.publishedAt || null;
  const publishedAt = existingPublishedAt || (status === "published" ? new Date() : null);
  const seo = scoreArticleSeo({
    title,
    slug,
    excerpt,
    content,
    focusKeyword,
    metaTitle,
    metaDescription,
    canonicalUrl,
    coverAlt,
    schemaType: "Article",
  });

  const article: ArticleView = {
    id: `article-${slug}`,
    categoryId,
    category,
    title,
    slug,
    excerpt,
    content,
    status,
    coverImage,
    coverAlt,
    focusKeyword,
    metaTitle,
    metaDescription,
    canonicalUrl,
    robots: "index,follow",
    ogImage: coverImage,
    schemaType: "Article",
    faqs,
    seoScore: seo.score,
    seoChecklist: seo.checks,
    publishedAt,
    updatedAt: new Date(),
  };

  if (!db) {
    if (originalSlug !== slug) demoArticles().delete(originalSlug);
    demoArticles().set(slug, article);
    return article;
  }

  const articleData = {
    categoryId,
    title,
    excerpt,
    content,
    focusKeyword,
    metaTitle,
    metaDescription,
    canonicalUrl,
    coverImage,
    coverAlt,
    ogImage: coverImage,
    status,
    faqs,
    seoScore: seo.score,
    seoChecklist: seo.checks,
    publishedAt,
  };

  const saved = existing
    ? await db.article.update({
        where: { id: existing.id },
        data: { ...articleData, slug },
        include: { category: true },
      })
    : await db.article.upsert({
        where: { slug },
        update: articleData,
        create: {
          ...articleData,
          slug,
          schemaType: "Article",
        },
        include: { category: true },
      });
  return articleWithNormalizedRelations(saved as unknown as ArticleRecord);
}

export async function getAdminBusinessDashboard(): Promise<AdminBusinessDashboard> {
  const db = getDb();
  if (!db) {
    const demoUserIds = new Set<string>();
    for (const chart of charts().values()) {
      if (chart.userId) demoUserIds.add(chart.userId);
    }
    for (const reading of readings().values()) {
      demoUserIds.add(reading.userId);
    }

    const recentUsers = Array.from(demoUserIds)
      .map((userId) => {
        const userCharts = Array.from(charts().values()).filter((chart) => chart.userId === userId);
        const userReadings = Array.from(readings().values()).filter((reading) => reading.userId === userId);
        const latestChart = userCharts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
        return {
          id: userId,
          email: userId.includes("@") ? userId : `${userId}@demo.local`,
          name: userId.startsWith("guest-") ? "Khách xem thử" : "Demo user",
          role: "USER" as const,
          coinBalance: balances().get(userId) || 0,
          createdAt: latestChart?.createdAt || new Date(0),
          chartsCount: userCharts.length,
          readingsCount: userReadings.length,
          paidOrdersCount: 0,
          totalPaidVnd: 0,
          lastPaymentAt: null,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 12);

    return {
      revenue: emptyRevenueMetrics(),
      recentUsers,
      recentPayments: [],
    };
  }

  const [payments, users] = await Promise.all([
    db.paymentOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        _count: {
          select: {
            charts: true,
            readings: true,
            payments: true,
          },
        },
        payments: {
          where: { status: "PAID" },
          select: {
            amountVnd: true,
            status: true,
            paidAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
  ]);

  return {
    revenue: summarizeRevenue(payments as AdminPaymentRecord[]),
    recentPayments: (payments as AdminPaymentRecord[]).slice(0, 8).map(normalizeRecentPayment),
    recentUsers: users.map((item) => {
      const paidPayments = item.payments.filter((payment) => payment.status === "PAID");
      const lastPayment = paidPayments[0];
      return {
        id: item.id,
        email: item.email,
        name: item.name,
        role: item.role,
        coinBalance: item.coinBalance,
        createdAt: item.createdAt,
        chartsCount: item._count.charts,
        readingsCount: item._count.readings,
        paidOrdersCount: paidPayments.length,
        totalPaidVnd: paidPayments.reduce((sum, payment) => sum + payment.amountVnd, 0),
        lastPaymentAt: lastPayment ? paymentDate(lastPayment) : null,
      };
    }),
  };
}

export async function listAdminChartSubmissions(limit = 80): Promise<AdminChartSubmission[]> {
  const db = getDb();
  if (!db) {
    return Array.from(charts().values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .map((chart) => {
        const userEmail = chart.userId?.includes("@") ? chart.userId : null;
        return normalizeAdminChartSubmission({
          id: chart.id,
          title: chart.title,
          input: chart.input,
          userId: chart.userId || null,
          creationIp: chart.creationIp || null,
          creationUserAgent: chart.creationUserAgent || null,
          createdAt: chart.createdAt,
          user: userEmail ? { email: userEmail, name: null } : null,
        });
      });
  }

  const rows = await db.chart.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      input: true,
      userId: true,
      creationIp: true,
      creationUserAgent: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
  return rows.map((row) => normalizeAdminChartSubmission(row));
}

export async function getAdminOverview(periodInput?: string | null) {
  const period = normalizeAdminTrendPeriod(periodInput);
  const db = getDb();
  const [operationSettings, featurePrices] = await Promise.all([getOperationSettings(), getFeaturePrices()]);
  const pseoEntityCount = MAIN_STARS.length + PALACES.length + SUPPORT_STARS.length;
  const sitemapFiles = 2 + MAIN_STARS.length;
  if (!db) {
    const demoCharts = Array.from(charts().values());
    const guestCharts = demoCharts.filter((chart) => !chart.userId).length;
    const pseoArticles = buildPseoInventory().filter((page) => page.status === "PUBLISHED").length + pseoEntityCount;
    const sitemapMainUrls = CORE_SITEMAP_URLS + SUPPORT_STARS.length + TRUST_SITEMAP_URLS
      + Array.from(demoArticles().values()).filter(isIndexableSitemapArticle).length;
    const trendGroups = buildDemoAdminTrendGroups();
    return {
      users: 1,
      charts: demoCharts.length,
      readings: readings().size,
      unlockedReadings: readings().size,
      articles: demoArticles().size,
      seoArticles: demoArticles().size,
      pseoArticles,
      payments: 0,
      guestCharts,
      guestChartRate: demoCharts.length ? Math.round((guestCharts / demoCharts.length) * 1000) / 10 : 0,
      sitemapFiles,
      sitemapMainUrls,
      trendPeriod: period,
      trends: trendGroups[period],
      trendGroups,
      coinPackages: COIN_PACKAGES,
      featurePrices,
      operationSettings,
    };
  }
  const [
    users,
    chartCount,
    guestChartCount,
    readingCount,
    unlockedReadingCount,
    articleCount,
    sitemapArticles,
    pseoPageCount,
    paymentCount,
    packages,
    trendGroups,
  ] = await Promise.all([
    db.user.count(),
    db.chart.count(),
    db.chart.count({ where: { userId: null } }),
    db.reading.count(),
    db.reading.count({ where: { status: "COMPLETED" } }),
    db.article.count({ where: { status: { not: DELETED_ARTICLE_STATUS } } }),
    db.article.findMany({
      where: { status: "published" },
      select: { slug: true, status: true, robots: true, canonicalUrl: true },
    }),
    db.pseoPage.count({ where: { status: "PUBLISHED" } }),
    db.paymentOrder.count(),
    db.coinPackage.findMany({ orderBy: { priceVnd: "asc" } }),
    buildDbAdminTrendGroups(db),
  ]);
  const sitemapMainUrls = CORE_SITEMAP_URLS + SUPPORT_STARS.length + TRUST_SITEMAP_URLS
    + sitemapArticles.filter(isIndexableSitemapArticle).length;
  return {
    users,
    charts: chartCount,
    readings: readingCount,
    unlockedReadings: unlockedReadingCount,
    articles: articleCount,
    seoArticles: articleCount,
    pseoArticles: pseoPageCount + pseoEntityCount,
    payments: paymentCount,
    guestCharts: guestChartCount,
    guestChartRate: chartCount ? Math.round((guestChartCount / chartCount) * 1000) / 10 : 0,
    sitemapFiles,
    sitemapMainUrls,
    trendPeriod: period,
    trends: trendGroups[period],
    trendGroups,
    coinPackages: packages.length ? packages : COIN_PACKAGES,
    featurePrices,
    operationSettings,
  };
}
