import "server-only";

import { randomUUID } from "node:crypto";
import type { SessionUser } from "@/lib/auth";
import { CHART_ENGINE_VERSION, generateTuViChart, type ChartInput, type TuViChart } from "@/lib/chart";
import type { ChartAttribution } from "@/lib/chart-attribution";
import { getDb } from "@/lib/db";
import { createPerfTimer, logPerfEvent } from "@/lib/perf";
import type { ChartCreationMetadata, ChartHistoryItem, StoredChart } from "./contracts";
import { charts, readings, usesInMemoryUser } from "./demo-store";

type ChartCreateRecord = {
  id: string;
  title: string;
  input: unknown;
  chart: unknown;
  userId?: string | null;
  creationIp?: string | null;
  creationUserAgent?: string | null;
  creationSource?: string | null;
  creationAttribution?: unknown;
  createdAt: Date;
};

type ChartCreateDelegate = {
  create(args: { data: Record<string, unknown> }): Promise<ChartCreateRecord>;
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
  return { ...value, source, label, confidence } as ChartAttribution;
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
  return { ...record, title: chartTitle(chart), input: chart.input, chart };
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
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
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
        select: { id: true, title: true, input: true, chart: true, userId: true, createdAt: true },
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

export async function countRecentChartsForIp(requestIp: string | undefined, since: Date) {
  if (!requestIp) return 0;
  const db = getDb();
  if (!db) {
    return Array.from(charts().values()).filter((chart) => chart.creationIp === requestIp && chart.createdAt >= since).length;
  }
  return db.chart.count({ where: { creationIp: requestIp, createdAt: { gte: since } } });
}

export async function saveChart(input: ChartInput, user: SessionUser | null, metadata: ChartCreationMetadata = {}) {
  const timer = createPerfTimer();
  const chart = await timer.time("engine", () => generateTuViChart(input));
  const title = chartTitle(chart);
  const db = getDb();
  const duplicate = await timer.time("duplicateLookup", () => findPurchasedDuplicateChart(user, chart.input));
  if (duplicate) {
    logPerfEvent("save_chart_timing", timer.total(), { hasUser: Boolean(user), result: "duplicate", timings: timer.timings() });
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
      creationSource: metadata.attribution?.source,
      creationAttribution: metadata.attribution,
      createdAt: new Date(),
    };
    charts().set(id, stored);
    logPerfEvent("save_chart_timing", timer.total(), { hasUser: Boolean(user), result: "demo-created", timings: timer.timings() });
    return stored;
  }

  const chartDelegate = db.chart as unknown as ChartCreateDelegate;
  const created = await timer.time("dbCreate", () => chartDelegate.create({
    data: {
      title,
      input: chart.input,
      chart,
      userId: user?.id,
      isPrivate: true,
      creationIp: metadata.requestIp,
      creationUserAgent: metadata.userAgent,
      creationSource: metadata.attribution?.source,
      creationAttribution: metadata.attribution,
    },
  }));
  const stored = {
    id: created.id,
    title: created.title,
    input: created.input as ChartInput,
    chart: created.chart as TuViChart,
    userId: created.userId || undefined,
    creationIp: created.creationIp || undefined,
    creationUserAgent: created.creationUserAgent || undefined,
    creationSource: created.creationSource || undefined,
    creationAttribution: normalizeStoredAttribution(created.creationAttribution),
    createdAt: created.createdAt,
  };
  logPerfEvent("save_chart_timing", timer.total(), { hasUser: Boolean(user), result: "created", timings: timer.timings() });
  return stored;
}

function chartIdFromChartPath(value: string) {
  const [withoutHash] = value.split("#");
  const [pathname] = withoutHash.split("?");
  const match = /^\/la-so\/([^/?#]+)$/.exec(pathname);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

class GuestCheckoutClaimConflict extends Error {}

export async function claimGuestChartForCheckout(chartId: string, fullName: string): Promise<SessionUser | null> {
  const email = `guest-checkout-${randomUUID()}@checkout.lasotinhhoa.local`;
  const name = fullName.trim() || "Khach xem la so";
  const db = getDb();

  if (!db) {
    const chart = charts().get(chartId);
    if (!chart || chart.userId) return null;
    const user: SessionUser = { id: `guest-checkout-${randomUUID()}`, email, name, role: "USER", coinBalance: 0 };
    charts().set(chartId, { ...chart, userId: user.id });
    return user;
  }

  try {
    return await db.$transaction(async (transaction) => {
      const created = await transaction.user.create({ data: { email, name, coinBalance: 0 } });
      const claimed = await transaction.chart.updateMany({ where: { id: chartId, userId: null }, data: { userId: created.id } });
      if (claimed.count !== 1) throw new GuestCheckoutClaimConflict();
      return { id: created.id, email: created.email, name: created.name || name, role: created.role, coinBalance: created.coinBalance };
    });
  } catch (error) {
    if (error instanceof GuestCheckoutClaimConflict) return null;
    throw error;
  }
}

export async function claimGuestChartForUserFromPath(value: string, user: SessionUser) {
  const chartId = chartIdFromChartPath(value);
  if (!chartId) return false;

  const db = getDb();
  if (!db || usesInMemoryUser(user.id)) {
    const chart = charts().get(chartId);
    if (!chart || chart.userId) return false;
    charts().set(chartId, { ...chart, userId: user.id });
    return true;
  }

  const updated = await db.chart.updateMany({ where: { id: chartId, userId: null }, data: { userId: user.id } });
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
    await db.chart.update({ where: { id }, data: { title: upgraded.title, input: upgraded.input, chart: upgraded.chart } });
  }
  return upgraded;
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
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

    return userCharts.map((chart) => {
      const advanced = Array.from(readings().values()).find(
        (reading) =>
          (includeAll || reading.userId === userId) &&
          reading.chartId === chart.id &&
          reading.type === "FULL" &&
          reading.scopeKey === "all" &&
          (reading.status ?? "COMPLETED") === "COMPLETED",
      );
      return { ...chart, hasAdvancedReading: Boolean(advanced), advancedReadingId: advanced?.id };
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
    return { ...upgraded, hasAdvancedReading: chart.readings.length > 0, advancedReadingId: chart.readings[0]?.id };
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
