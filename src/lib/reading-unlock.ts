import type { TuViChart } from "@/lib/chart";
import type { ReadingKey } from "@/lib/pricing";
import type { SessionUser } from "@/lib/auth";
import {
  isReadingBundleKey,
  readingBundleItemPrice,
  readingBundleItems,
  readingBundleLabel,
  readingBundleScopeKey,
  type ReadingBundleKey,
} from "@/lib/reading-bundles";

type ChartRecord = {
  id: string;
  chart: TuViChart;
  userId?: string;
};

type FeaturePrice = {
  label: string;
  priceCoins: number;
};

type StoredReading = {
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

type ReadingGeneration = {
  content: string;
  model: string;
  prompt?: string;
};

export type ReadingUnlockDeps = {
  getChart: (chartId: string) => Promise<ChartRecord | null>;
  getCachedReading: (userId: string, chartId: string, type: ReadingKey, scopeKey: string) => Promise<StoredReading | null>;
  getReadingJobByScope: (userId: string, chartId: string, type: ReadingKey, scopeKey: string) => Promise<StoredReading | null>;
  hasReadingBundleAccess?: (user: SessionUser, chartId: string, type: ReadingKey) => Promise<boolean>;
  getCompletedReadingsForScopes?: (
    user: SessionUser,
    chartId: string,
    keys: { type: ReadingKey; scopeKey: string }[],
  ) => Promise<Map<string, StoredReading>>;
  getFeaturePrice: (type: ReadingKey) => Promise<FeaturePrice>;
  getUserBalance: (user: SessionUser) => Promise<number>;
  adjustCoins: (user: SessionUser, amount: number, reason: string, referenceId?: string) => Promise<number>;
  generateReading: (chart: TuViChart, type: ReadingKey, scopeKey: string) => Promise<ReadingGeneration>;
  createPendingReading: (
    user: SessionUser,
    chartId: string,
    type: ReadingKey,
    scopeKey: string,
    priceCoins: number,
    promptMeta?: unknown,
  ) => Promise<StoredReading>;
  saveReading: (
    user: SessionUser,
    chartId: string,
    type: ReadingKey,
    scopeKey: string,
    priceCoins: number,
    content: string,
    promptMeta?: unknown,
  ) => Promise<StoredReading>;
};

export type ReadingUnlockResult =
  | { status: "cached"; readingId: string; chargedCoins: 0 }
  | { status: "created"; readingId: string; chargedCoins: number }
  | { status: "forbidden" }
  | { status: "disabled" }
  | { status: "insufficient_coins"; needCoins: number; priceCoins: number; balance: number };

export type FullReadingJobStartResult =
  | { status: "cached"; readingId: string; chargedCoins: 0 }
  | { status: "pending"; readingId: string; chargedCoins: 0 }
  | { status: "queued"; readingId: string; chargedCoins: number }
  | { status: "forbidden" }
  | { status: "disabled" }
  | { status: "insufficient_coins"; needCoins: number; priceCoins: number; balance: number };

export type ReadingBundleUnlockResult =
  | { status: "cached"; readingId: string; chargedCoins: 0; unlockedCount: number; totalCount: number }
  | { status: "created"; readingId: string; chargedCoins: number; unlockedCount: number; totalCount: number }
  | { status: "forbidden" }
  | { status: "disabled" }
  | { status: "insufficient_coins"; needCoins: number; priceCoins: number; balance: number };

function canUnlockChart(user: SessionUser, chart: ChartRecord) {
  return user.role === "ADMIN" || chart.userId === user.id;
}

export async function startFullReadingJobForUser(
  deps: ReadingUnlockDeps,
  params: {
    user: SessionUser;
    chartId: string;
    temporaryFullAccess?: boolean;
    paidReadingsEnabled?: boolean;
  },
): Promise<FullReadingJobStartResult> {
  const { user, chartId } = params;
  if (params.paidReadingsEnabled === false && user.role !== "ADMIN") return { status: "disabled" };

  const chartRecord = await deps.getChart(chartId);
  if (!chartRecord) throw new Error("Không tìm thấy lá số.");
  if (!canUnlockChart(user, chartRecord)) return { status: "forbidden" };

  const cached = await deps.getCachedReading(user.id, chartId, "FULL", "all");
  if (cached) return { status: "cached", readingId: cached.id, chargedCoins: 0 };

  const existingJob = await deps.getReadingJobByScope(user.id, chartId, "FULL", "all");
  if (existingJob?.status === "PENDING") return { status: "pending", readingId: existingJob.id, chargedCoins: 0 };

  const price = await deps.getFeaturePrice("FULL");
  const shouldCharge = !params.temporaryFullAccess && user.role !== "ADMIN";
  const balance = shouldCharge ? await deps.getUserBalance(user) : 0;
  if (shouldCharge && balance < price.priceCoins) {
    return {
      status: "insufficient_coins",
      needCoins: price.priceCoins - balance,
      priceCoins: price.priceCoins,
      balance,
    };
  }

  let debited = false;
  const referenceId = `${chartId}:FULL:all`;

  try {
    if (shouldCharge) {
      await deps.adjustCoins(user, -price.priceCoins, price.label, referenceId);
      debited = true;
    }

    const reading = await deps.createPendingReading(user, chartId, "FULL", "all", shouldCharge ? price.priceCoins : 0, {
      type: "FULL",
      scopeKey: "all",
      phase: "queued",
      queuedAt: new Date().toISOString(),
      progress: { completed: 0, total: 8, chapters: [] },
    });

    return { status: "queued", readingId: reading.id, chargedCoins: shouldCharge ? price.priceCoins : 0 };
  } catch (error) {
    if (debited) {
      await deps.adjustCoins(user, price.priceCoins, "Hoàn xu do lỗi tạo job luận giải", referenceId);
    }
    throw error;
  }
}

export async function unlockReadingForUser(
  deps: ReadingUnlockDeps,
  params: {
    user: SessionUser;
    chartId: string;
    type: ReadingKey;
    scopeKey: string;
    temporaryFullAccess?: boolean;
    paidReadingsEnabled?: boolean;
  },
): Promise<ReadingUnlockResult> {
  const { user, chartId, type, scopeKey } = params;
  if (params.paidReadingsEnabled === false && user.role !== "ADMIN") return { status: "disabled" };

  const chartRecord = await deps.getChart(chartId);
  if (!chartRecord) throw new Error("Không tìm thấy lá số.");
  if (!canUnlockChart(user, chartRecord)) return { status: "forbidden" };

  const cached = await deps.getCachedReading(user.id, chartId, type, scopeKey);
  if (cached) return { status: "cached", readingId: cached.id, chargedCoins: 0 };

  const hasBundleAccess = isReadingBundleKey(type) && Boolean(await deps.hasReadingBundleAccess?.(user, chartId, type));
  const price = hasBundleAccess ? { label: `Gói trọn nhóm ${readingBundleLabel(type)}`, priceCoins: 0 } : await deps.getFeaturePrice(type);
  const shouldCharge = !hasBundleAccess && !params.temporaryFullAccess && user.role !== "ADMIN";
  const balance = shouldCharge ? await deps.getUserBalance(user) : 0;
  if (shouldCharge && balance < price.priceCoins) {
    return {
      status: "insufficient_coins",
      needCoins: price.priceCoins - balance,
      priceCoins: price.priceCoins,
      balance,
    };
  }

  let debited = false;
  const referenceId = `${chartId}:${type}:${scopeKey}`;

  try {
    if (shouldCharge) {
      await deps.adjustCoins(user, -price.priceCoins, price.label, referenceId);
      debited = true;
    }

    const result = await deps.generateReading(chartRecord.chart, type, scopeKey);
    const reading = await deps.saveReading(
      user,
      chartId,
      type,
      scopeKey,
      shouldCharge ? price.priceCoins : 0,
      result.content,
      { type, scopeKey, model: result.model, prompt: result.prompt },
    );

    return {
      status: "created",
      readingId: reading.id,
      chargedCoins: shouldCharge ? price.priceCoins : 0,
    };
  } catch (error) {
    if (debited) {
      await deps.adjustCoins(user, price.priceCoins, "Hoàn xu do AI lỗi", referenceId);
    }
    throw error;
  }
}

export async function unlockReadingBundleForUser(
  deps: ReadingUnlockDeps,
  params: {
    user: SessionUser;
    chartId: string;
    type: ReadingBundleKey;
    temporaryFullAccess?: boolean;
    paidReadingsEnabled?: boolean;
  },
): Promise<ReadingBundleUnlockResult> {
  const { user, chartId, type } = params;
  if (params.paidReadingsEnabled === false && user.role !== "ADMIN") return { status: "disabled" };

  const chartRecord = await deps.getChart(chartId);
  if (!chartRecord) throw new Error("KhÃ´ng tÃ¬m tháº¥y lÃ¡ sá»‘.");
  if (!canUnlockChart(user, chartRecord)) return { status: "forbidden" };

  const bundleScopeKey = readingBundleScopeKey(type);
  const items = readingBundleItems(chartRecord.chart, type);
  const cached = await deps.getCachedReading(user.id, chartId, type, bundleScopeKey);
  if (cached) return { status: "cached", readingId: cached.id, chargedCoins: 0, unlockedCount: 0, totalCount: items.length };

  const keys = items.map((item) => ({ type, scopeKey: item.scopeKey }));
  const completedReadings = deps.getCompletedReadingsForScopes
    ? await deps.getCompletedReadingsForScopes(user, chartId, keys)
    : new Map<string, StoredReading>();
  const remainingItems = items.filter((item) => !completedReadings.has(`${type}:${item.scopeKey}`));
  const featurePrice = await deps.getFeaturePrice(type);
  const bundlePrice = readingBundleItemPrice(featurePrice.priceCoins, remainingItems.length);
  const shouldCharge = bundlePrice > 0 && !params.temporaryFullAccess && user.role !== "ADMIN";
  const balance = shouldCharge ? await deps.getUserBalance(user) : 0;

  if (shouldCharge && balance < bundlePrice) {
    return {
      status: "insufficient_coins",
      needCoins: bundlePrice - balance,
      priceCoins: bundlePrice,
      balance,
    };
  }

  let debited = false;
  const label = readingBundleLabel(type);
  const referenceId = `${chartId}:${type}:${bundleScopeKey}`;

  try {
    if (shouldCharge) {
      await deps.adjustCoins(user, -bundlePrice, `Gói trọn nhóm ${label}`, referenceId);
      debited = true;
    }

    const reading = await deps.saveReading(
      user,
      chartId,
      type,
      bundleScopeKey,
      shouldCharge ? bundlePrice : 0,
      `# Đã mở trọn nhóm ${label}

Bạn đã mở quyền đọc toàn bộ nhóm ${label} cho lá số này. Từ bây giờ, khi chọn từng mục trong nhóm, hệ thống sẽ tạo phần luận chi tiết và không trừ xu thêm.`,
      {
        type,
        scopeKey: bundleScopeKey,
        bundle: true,
        totalCount: items.length,
        unlockedCount: remainingItems.length,
        unitPriceCoins: featurePrice.priceCoins,
        discountPercent: 50,
      },
    );

    return {
      status: "created",
      readingId: reading.id,
      chargedCoins: shouldCharge ? bundlePrice : 0,
      unlockedCount: remainingItems.length,
      totalCount: items.length,
    };
  } catch (error) {
    if (debited) {
      await deps.adjustCoins(user, bundlePrice, "HoÃ n xu do lá»—i má»Ÿ gÃ³i trọn nhóm", referenceId);
    }
    throw error;
  }
}
