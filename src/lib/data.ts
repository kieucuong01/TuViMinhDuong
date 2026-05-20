import "server-only";

import { generateTuViChart, type ChartInput, type TuViChart } from "@/lib/chart";
import { articleWithScore, seedArticles, type ArticleView } from "@/lib/content";
import { getDb } from "@/lib/db";
import { FEATURE_PRICES, COIN_PACKAGES, type ReadingKey } from "@/lib/pricing";
import { scoreArticleSeo } from "@/lib/seo";
import { slugify } from "@/lib/format";
import type { SessionUser } from "@/lib/auth";

type StoredChart = {
  id: string;
  title: string;
  input: ChartInput;
  chart: TuViChart;
  userId?: string;
  createdAt: Date;
};

type StoredReading = {
  id: string;
  userId: string;
  chartId: string;
  type: ReadingKey;
  scopeKey: string;
  priceCoins: number;
  content: string;
  createdAt: Date;
};

export type ChartHistoryItem = StoredChart & {
  hasAdvancedReading: boolean;
  advancedReadingId?: string;
};

const globalStore = globalThis as unknown as {
  demoCharts?: Map<string, StoredChart>;
  demoReadings?: Map<string, StoredReading>;
  demoBalances?: Map<string, number>;
  demoArticles?: Map<string, ArticleView>;
};

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

function usesInMemoryUser(userId: string) {
  return userId.startsWith("demo-") || userId.startsWith("guest-");
}

export async function saveChart(input: ChartInput, user: SessionUser | null) {
  const chart = generateTuViChart(input);
  const title = `${chart.input.fullName} - ${chart.canChi.year}`;
  const db = getDb();

  if (!db) {
    const id = `demo-chart-${Date.now()}`;
    const stored = { id, title, input: chart.input, chart, userId: user?.id, createdAt: new Date() };
    charts().set(id, stored);
    return stored;
  }

  const created = await db.chart.create({
    data: {
      title,
      input: chart.input,
      chart,
      userId: user?.id,
      isPrivate: true,
    },
  });
  return {
    id: created.id,
    title: created.title,
    input: created.input as ChartInput,
    chart: created.chart as TuViChart,
    userId: created.userId || undefined,
    createdAt: created.createdAt,
  };
}

export async function getChart(id: string) {
  const db = getDb();
  if (!db) return charts().get(id) || null;
  const chart = await db.chart.findUnique({ where: { id } });
  return chart
    ? {
        id: chart.id,
        title: chart.title,
        input: chart.input as ChartInput,
        chart: chart.chart as TuViChart,
        userId: chart.userId || undefined,
        createdAt: chart.createdAt,
      }
    : null;
}

export async function listUserCharts(userId: string, includeAll = false): Promise<ChartHistoryItem[]> {
  const db = getDb();
  if (!db || usesInMemoryUser(userId)) {
    const userCharts = Array.from(charts().values())
      .filter((chart) => includeAll || chart.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return userCharts.map((chart) => {
      const advanced = Array.from(readings().values()).find(
        (reading) => (includeAll || reading.userId === userId) && reading.chartId === chart.id && reading.type === "FULL" && reading.scopeKey === "all",
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

  return userCharts.map((chart) => ({
    id: chart.id,
    title: chart.title,
    input: chart.input as ChartInput,
    chart: chart.chart as TuViChart,
    userId: chart.userId || undefined,
    createdAt: chart.createdAt,
    hasAdvancedReading: chart.readings.length > 0,
    advancedReadingId: chart.readings[0]?.id,
  }));
}

export async function getFeaturePrice(type: ReadingKey) {
  const fallback = FEATURE_PRICES[type];
  const db = getDb();
  if (!db) return fallback;
  const price = await db.featurePrice.findUnique({ where: { key: type } });
  return price?.isActive ? { label: price.label, priceCoins: price.priceCoins } : fallback;
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
  if (!db || usesInMemoryUser(userId)) return readings().get(`${userId}:${chartId}:${type}:${scopeKey}`) || null;
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

export async function getAnyCompletedReading(chartId: string, type: ReadingKey, scopeKey: string) {
  const db = getDb();
  if (!db) {
    return Array.from(readings().values()).find(
      (reading) => reading.chartId === chartId && reading.type === type && reading.scopeKey === scopeKey,
    ) || null;
  }
  const reading = await db.reading.findFirst({
    where: { chartId, type, scopeKey, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
  });
  return reading?.content
    ? {
        id: reading.id,
        userId: reading.userId,
        chartId: reading.chartId,
        type: reading.type as ReadingKey,
        scopeKey: reading.scopeKey,
        priceCoins: reading.priceCoins,
        content: reading.content,
        createdAt: reading.createdAt,
      }
    : null;
}

export async function getReadingById(userId: string, readingId: string) {
  const db = getDb();
  if (!db || usesInMemoryUser(userId)) {
    return Array.from(readings().values()).find((reading) => reading.id === readingId && reading.userId === userId) || null;
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
    const reading = { id, userId: user.id, chartId, type, scopeKey, priceCoins, content, createdAt: new Date() };
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

export async function listArticles() {
  const db = getDb();
  if (!db) return Array.from(demoArticles().values()).sort((a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0));
  const articles = await db.article.findMany({
    where: { status: "published" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
  const bySlug = new Map(seedArticles.map((article) => [article.slug, articleWithScore(article)]));
  for (const article of articles) {
    bySlug.set(article.slug, articleWithScore(article as ArticleView));
  }
  return Array.from(bySlug.values()).sort((a, b) => {
    const bDate = b.publishedAt?.getTime() || b.updatedAt?.getTime() || 0;
    const aDate = a.publishedAt?.getTime() || a.updatedAt?.getTime() || 0;
    return bDate - aDate;
  });
}

export async function getArticleBySlug(slug: string) {
  const db = getDb();
  if (!db) return demoArticles().get(slug) || null;
  const article = await db.article.findUnique({ where: { slug } });
  return article ? articleWithScore(article as ArticleView) : seedArticles.map(articleWithScore).find((item) => item.slug === slug) || null;
}

export async function saveArticleFromForm(formData: FormData) {
  const title = String(formData.get("title") || "");
  const content = String(formData.get("content") || "");
  const excerpt = String(formData.get("excerpt") || "");
  const focusKeyword = String(formData.get("focusKeyword") || "");
  const slug = slugify(String(formData.get("slug") || title));
  const metaTitle = String(formData.get("metaTitle") || title);
  const metaDescription = String(formData.get("metaDescription") || excerpt);
  const canonicalUrl = String(formData.get("canonicalUrl") || `/kien-thuc-tu-vi/${slug}`);
  const coverImage = String(formData.get("coverImage") || "/og-default.svg");
  const coverAlt = String(formData.get("coverAlt") || "");
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
    title,
    slug,
    excerpt,
    content,
    status: "published",
    coverImage,
    coverAlt,
    focusKeyword,
    metaTitle,
    metaDescription,
    canonicalUrl,
    robots: "index,follow",
    schemaType: "Article",
    seoScore: seo.score,
    seoChecklist: seo.checks,
    publishedAt: new Date(),
    updatedAt: new Date(),
  };

  const db = getDb();
  if (!db) {
    demoArticles().set(slug, article);
    return article;
  }

  const saved = await db.article.upsert({
    where: { slug },
    update: {
      title,
      excerpt,
      content,
      focusKeyword,
      metaTitle,
      metaDescription,
      canonicalUrl,
      coverImage,
      coverAlt,
      status: "published",
      seoScore: seo.score,
      seoChecklist: seo.checks,
      publishedAt: new Date(),
    },
    create: {
      title,
      slug,
      excerpt,
      content,
      focusKeyword,
      metaTitle,
      metaDescription,
      canonicalUrl,
      coverAlt,
      coverImage,
      status: "published",
      schemaType: "Article",
      seoScore: seo.score,
      seoChecklist: seo.checks,
      publishedAt: new Date(),
    },
  });
  return articleWithScore(saved as ArticleView);
}

export async function getAdminOverview() {
  const db = getDb();
  if (!db) {
    return {
      users: 1,
      charts: charts().size,
      readings: readings().size,
      articles: demoArticles().size,
      payments: 0,
      coinPackages: COIN_PACKAGES,
      featurePrices: FEATURE_PRICES,
    };
  }
  const [users, chartCount, readingCount, articleCount, paymentCount, packages, prices] = await Promise.all([
    db.user.count(),
    db.chart.count(),
    db.reading.count(),
    db.article.count(),
    db.paymentOrder.count(),
    db.coinPackage.findMany({ orderBy: { priceVnd: "asc" } }),
    db.featurePrice.findMany(),
  ]);
  return {
    users,
    charts: chartCount,
    readings: readingCount,
    articles: articleCount,
    payments: paymentCount,
    coinPackages: packages.length ? packages : COIN_PACKAGES,
    featurePrices: prices.length ? Object.fromEntries(prices.map((item) => [item.key, { label: item.label, priceCoins: item.priceCoins }])) : FEATURE_PRICES,
  };
}
