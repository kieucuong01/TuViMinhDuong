import "server-only";

import type { ChartInput } from "@/lib/chart";
import type { ChartAttribution } from "@/lib/chart-attribution";
import { getDb } from "@/lib/db";
import { COIN_PACKAGES } from "@/lib/pricing";
import { MAIN_STARS, PALACES, SUPPORT_STARS, buildPseoInventory } from "@/lib/pseo-registry";
import { DELETED_ARTICLE_STATUS } from "@/lib/data/articles";
import { balances, charts, demoArticles, readings } from "@/lib/data/demo-store";
import { getFeaturePrices, getOperationSettings } from "@/lib/data/settings";
import { buildAdminFunnelDashboard, type FunnelReportEvent, type FunnelReportPayment } from "@/lib/funnel-report";
import type {
  AdminBusinessDashboard,
  AdminChartSubmission,
  AdminFunnelDashboard,
  AdminPaymentSource,
  AdminRecentPayment,
  AdminRevenueMetrics,
  AdminTrendGroups,
  AdminTrendPeriod,
  AdminTrendPoint,
} from "@/lib/data/contracts";

const ADMIN_TREND_PERIODS = new Set<AdminTrendPeriod>(["day", "week", "month"]);
const ADMIN_TREND_PERIOD_LIST: AdminTrendPeriod[] = ["day", "week", "month"];
const CORE_SITEMAP_URLS = 7;
const TRUST_SITEMAP_URLS = 8;

type AdminFunnelDb = {
  funnelEvent: {
    findMany(args: Record<string, unknown>): Promise<FunnelReportEvent[]>;
  };
  paymentOrder: {
    findMany(args: Record<string, unknown>): Promise<FunnelReportPayment[]>;
  };
};

export async function getAdminFunnelDashboard(): Promise<AdminFunnelDashboard> {
  const now = new Date();
  const db = getDb() as unknown as AdminFunnelDb | null;
  if (!db?.funnelEvent) return buildAdminFunnelDashboard({ events: [], payments: [], now });
  const oldestWindowStart = new Date(now.getTime() - 56 * 86_400_000);
  const [events, payments] = await Promise.all([
    db.funnelEvent.findMany({
      where: { createdAt: { gte: oldestWindowStart } },
      select: {
        id: true,
        name: true,
        anonymousSessionId: true,
        userId: true,
        source: true,
        tool: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.paymentOrder.findMany({
      where: { status: "PENDING" },
      select: { status: true, amountVnd: true, createdAt: true },
    }),
  ]);
  return buildAdminFunnelDashboard({ events, payments, now });
}

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

function normalizeStoredAttribution(value: unknown): ChartAttribution | null {
  if (!isRecord(value)) return null;
  const source = String(value.source || "");
  const label = String(value.label || "");
  const confidence = value.confidence === "high" || value.confidence === "medium" || value.confidence === "low" ? value.confidence : "low";
  if (!source || !label) return null;
  return {
    ...value,
    source,
    label,
    confidence,
  } as ChartAttribution;
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
  creationSource?: string | null;
  creationAttribution?: unknown;
  createdAt: Date;
  user?: {
    id?: string;
    email: string;
    name: string | null;
  } | null;
};

type ChartCreateRecord = Omit<AdminChartSubmissionRecord, "user" | "input"> & {
  input: unknown;
  chart: unknown;
};

type ChartDelegateWithAttribution = {
  create(args: { data: Record<string, unknown> }): Promise<ChartCreateRecord>;
  findMany(args: Record<string, unknown>): Promise<AdminChartSubmissionRecord[]>;
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
    creationSource: record.creationSource || null,
    creationAttribution: normalizeStoredAttribution(record.creationAttribution),
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
          creationSource: chart.creationSource || null,
          creationAttribution: chart.creationAttribution || null,
          createdAt: chart.createdAt,
          user: userEmail ? { email: userEmail, name: null } : null,
        });
      });
  }

  const chartDelegate = db.chart as unknown as ChartDelegateWithAttribution;
  const rows = await chartDelegate.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      input: true,
      userId: true,
      creationIp: true,
      creationUserAgent: true,
      creationSource: true,
      creationAttribution: true,
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
