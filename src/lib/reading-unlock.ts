import type { TuViChart } from "@/lib/chart";
import type { ReadingKey } from "@/lib/pricing";
import type { SessionUser } from "@/lib/auth";

type ChartRecord = {
  id: string;
  chart: TuViChart;
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
  | { status: "disabled" }
  | { status: "insufficient_coins"; needCoins: number; priceCoins: number; balance: number };

export type FullReadingJobStartResult =
  | { status: "cached"; readingId: string; chargedCoins: 0 }
  | { status: "pending"; readingId: string; chargedCoins: 0 }
  | { status: "queued"; readingId: string; chargedCoins: number }
  | { status: "disabled" }
  | { status: "insufficient_coins"; needCoins: number; priceCoins: number; balance: number };

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

  const cached = await deps.getCachedReading(user.id, chartId, type, scopeKey);
  if (cached) return { status: "cached", readingId: cached.id, chargedCoins: 0 };

  const price = await deps.getFeaturePrice(type);
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
