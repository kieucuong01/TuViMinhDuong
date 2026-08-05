import "server-only";

import type { SessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { ReadingProgressInput } from "@/lib/reading-progress";
import { isReadingBundleKey, readingBundleScopeKey } from "@/lib/reading-bundles";
import type { ReadingKey } from "@/lib/pricing";
import {
  balances,
  readingProgressEntries,
  readings,
  usesInMemoryUser,
} from "@/lib/data/demo-store";
import type {
  ReadingScopeKey,
  StoredReading,
  StoredReadingProgress,
} from "@/lib/data/contracts";

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
