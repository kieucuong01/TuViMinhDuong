import type { FreeOverviewBlockKey } from "@/lib/ai";
import type { ChartAttribution } from "@/lib/chart-attribution";
import type { ChartInput, TuViChart } from "@/lib/chart";
import type { ArticleView } from "@/lib/content";
import type { ReadingKey } from "@/lib/pricing";
import type { ReadingProgressInput } from "@/lib/reading-progress";

export type StoredChart = {
  id: string;
  title: string;
  input: ChartInput;
  chart: TuViChart;
  userId?: string;
  creationIp?: string | null;
  creationUserAgent?: string | null;
  creationSource?: string | null;
  creationAttribution?: ChartAttribution | null;
  createdAt: Date;
};

export type ChartCreationMetadata = {
  requestIp?: string;
  userAgent?: string;
  attribution?: ChartAttribution;
};

export type ArticleSummary = Pick<
  ArticleView,
  "id" | "slug" | "title" | "excerpt" | "coverImage" | "coverAlt" | "publishedAt" | "updatedAt"
>;

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
  creationSource: string | null;
  creationAttribution: ChartAttribution | null;
};

export type FreeOverviewBlockProgress = {
  key: FreeOverviewBlockKey;
  status: "idle" | "processing" | "completed" | "failed";
  source: "llm" | "seed-rules";
  model?: string;
  generatedAt?: string;
};

export type FreeOverviewStatus =
  | {
      status: "ready";
      content: string;
      source: "llm" | "seed-rules";
      model: string;
      generatedAt: string;
      wordCount: number;
      jobStatus: "completed";
      blocks?: FreeOverviewBlockProgress[];
      completedBlocks?: number;
      totalBlocks?: number;
      nextBlockKey?: FreeOverviewBlockKey;
    }
  | {
      status: "fallback";
      content: string;
      source: "seed-rules";
      wordCount: number;
      jobStatus: "idle" | "processing" | "stale" | "failed";
      error?: string;
      blocks?: FreeOverviewBlockProgress[];
      completedBlocks?: number;
      totalBlocks?: number;
      nextBlockKey?: FreeOverviewBlockKey;
    };

export type FreeOverviewGenerationClaim =
  | { status: "ready"; overview: Extract<FreeOverviewStatus, { status: "ready" }> }
  | { status: "processing"; overview: Extract<FreeOverviewStatus, { status: "fallback" }> }
  | { status: "claimed" };

export type ChartHistoryItem = StoredChart & {
  hasAdvancedReading: boolean;
  advancedReadingId?: string;
};
