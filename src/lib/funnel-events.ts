import type { ChartAttribution } from "@/lib/chart-attribution";
import type { ChartCreationMetadata } from "@/lib/data/contracts";
import { getDb } from "@/lib/db";

export const FUNNEL_EVENT_RETENTION_DAYS = 180;
export const FUNNEL_SESSION_COOKIE = "lsth_funnel_session";

export const FUNNEL_EVENT_NAMES = [
  "landing",
  "tool_view",
  "submit",
  "result",
  "save_intent",
  "account",
  "checkout",
  "paid",
  "reading_complete",
] as const;

export type FunnelEventName = (typeof FUNNEL_EVENT_NAMES)[number];
export type FunnelSource = ChartAttribution["source"];
export type FunnelLandingClass =
  | "home"
  | "knowledge"
  | "date_tool"
  | "age_tool"
  | "wealth_tool"
  | "annual_tool"
  | "compatibility_tool"
  | "chart_result"
  | "pricing"
  | "other";
export type FunnelTool =
  | "chart"
  | "date_finder"
  | "age_compatibility"
  | "age_child"
  | "age_house"
  | "age_business"
  | "age_marriage"
  | "age_vehicle"
  | "wealth"
  | "annual_2026"
  | "compatibility"
  | "full_reading"
  | "coin_topup"
  | "knowledge"
  | "other";

export type FunnelAttributionSnapshot = {
  source: FunnelSource;
  landingClass: FunnelLandingClass;
  tool: FunnelTool;
  placement?: string;
};

export type FunnelEventInput = FunnelAttributionSnapshot & {
  name: FunnelEventName;
  anonymousSessionId?: string;
  userId?: string;
  chartId?: string;
  placement?: string;
  resultBand?: string;
  dedupeKey?: string;
  createdAt?: Date;
};

export type ClientFunnelEvent = {
  name: "landing" | "tool_view" | "submit" | "result" | "save_intent";
  eventId: string;
  anonymousSessionId: string;
  source?: FunnelSource;
  landingClass?: FunnelLandingClass;
  tool?: FunnelTool;
  placement?: string;
  resultBand?: string;
};

const CLIENT_EVENT_NAMES = new Set<ClientFunnelEvent["name"]>(["landing", "tool_view", "submit", "result", "save_intent"]);
const SOURCES = new Set<FunnelSource>(["ads", "organic_search", "ai", "internal", "referral", "direct", "unknown"]);
const LANDING_CLASSES = new Set<FunnelLandingClass>(["home", "knowledge", "date_tool", "age_tool", "wealth_tool", "annual_tool", "compatibility_tool", "chart_result", "pricing", "other"]);
const TOOLS = new Set<FunnelTool>(["chart", "date_finder", "age_compatibility", "age_child", "age_house", "age_business", "age_marriage", "age_vehicle", "wealth", "annual_2026", "compatibility", "full_reading", "coin_topup", "knowledge", "other"]);
const CLIENT_KEYS = new Set(["name", "eventId", "anonymousSessionId", "source", "landingClass", "tool", "placement", "resultBand"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab0-9][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CATEGORY_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;

function category(value: unknown) {
  return typeof value === "string" && CATEGORY_PATTERN.test(value) ? value : undefined;
}

export function normalizeAnonymousFunnelSessionId(value: unknown) {
  return typeof value === "string" && UUID_PATTERN.test(value) ? value : undefined;
}

export async function getServerFunnelSessionId() {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    return typeof cookieStore?.get === "function"
      ? normalizeAnonymousFunnelSessionId(cookieStore.get(FUNNEL_SESSION_COOKIE)?.value)
      : undefined;
  } catch {
    return undefined;
  }
}

export function parseClientFunnelEvent(value: unknown): ClientFunnelEvent | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !CLIENT_KEYS.has(key))) return null;
  if (typeof record.name !== "string" || !CLIENT_EVENT_NAMES.has(record.name as ClientFunnelEvent["name"])) return null;
  if (typeof record.eventId !== "string" || !UUID_PATTERN.test(record.eventId)) return null;
  if (typeof record.anonymousSessionId !== "string" || !UUID_PATTERN.test(record.anonymousSessionId)) return null;
  if (record.source !== undefined && (typeof record.source !== "string" || !SOURCES.has(record.source as FunnelSource))) return null;
  if (record.landingClass !== undefined && (typeof record.landingClass !== "string" || !LANDING_CLASSES.has(record.landingClass as FunnelLandingClass))) return null;
  if (record.tool !== undefined && (typeof record.tool !== "string" || !TOOLS.has(record.tool as FunnelTool))) return null;
  if (record.placement !== undefined && !category(record.placement)) return null;
  if (record.resultBand !== undefined && !category(record.resultBand)) return null;

  return {
    name: record.name as ClientFunnelEvent["name"],
    eventId: record.eventId,
    anonymousSessionId: record.anonymousSessionId,
    ...(record.source ? { source: record.source as FunnelSource } : {}),
    ...(record.landingClass ? { landingClass: record.landingClass as FunnelLandingClass } : {}),
    ...(record.tool ? { tool: record.tool as FunnelTool } : {}),
    ...(record.placement ? { placement: record.placement as string } : {}),
    ...(record.resultBand ? { resultBand: record.resultBand as string } : {}),
  };
}

export function funnelLandingClass(rawPath?: string | null): FunnelLandingClass {
  const value = String(rawPath || "");
  if (/^https?:\/\//i.test(value) || value.startsWith("//")) return "other";
  const pathname = value.split(/[?#]/, 1)[0] || "/";
  if (pathname === "/") return "home";
  if (pathname === "/xem-tu-vi-2026") return "annual_tool";
  if (pathname === "/tu-vi-tai-loc-dau-tu") return "wealth_tool";
  if (pathname === "/tuong-hop-la-so") return "compatibility_tool";
  if (pathname === "/xem-ngay" || pathname.startsWith("/xem-ngay/")) return "date_tool";
  if (pathname === "/xem-tuoi" || pathname.startsWith("/xem-tuoi/")) return "age_tool";
  if (pathname.startsWith("/kien-thuc-tu-vi/") || pathname === "/kien-thuc-tu-vi" || pathname.startsWith("/tra-cuu")) return "knowledge";
  if (/^\/la-so\/[^/]+/.test(pathname)) return "chart_result";
  if (pathname === "/pricing" || pathname === "/nap-xu") return "pricing";
  return "other";
}

export function funnelTool(raw?: string | null): FunnelTool {
  const value = String(raw || "").trim().toLowerCase();
  if (["chart", "chart_form", "lap-la-so"].includes(value)) return "chart";
  if (["date_finder", "xem-ngay"].includes(value)) return "date_finder";
  if (["xem-tuoi-vo-chong", "vo-chong"].includes(value)) return "age_compatibility";
  if (["xem-tuoi-sinh-con", "sinh-con"].includes(value)) return "age_child";
  if (["xem-tuoi-xay-nha", "xay-nha"].includes(value)) return "age_house";
  if (["xem-tuoi-lam-an", "lam-an"].includes(value)) return "age_business";
  if (["xem-tuoi-cuoi-hoi", "cuoi-hoi"].includes(value)) return "age_marriage";
  if (["xem-tuoi-mua-xe", "mua-xe"].includes(value)) return "age_vehicle";
  if (["wealth", "tu-vi-tai-loc-dau-tu"].includes(value)) return "wealth";
  if (["annual_2026", "xem-tu-vi-2026"].includes(value)) return "annual_2026";
  if (["compatibility", "tuong-hop-la-so"].includes(value)) return "compatibility";
  if (["full_reading", "full", "direct_full", "quick_reading"].includes(value)) return "full_reading";
  if (["coin_topup", "nap-xu"].includes(value)) return "coin_topup";
  if (["knowledge", "seo_article", "pseo_inline"].includes(value)) return "knowledge";
  return "other";
}

export function paymentFunnelAttribution(attribution?: ChartAttribution | null): FunnelAttributionSnapshot {
  return {
    source: attribution?.source && SOURCES.has(attribution.source) ? attribution.source : "unknown",
    landingClass: funnelLandingClass(attribution?.landingPath),
    tool: funnelTool(attribution?.sourceSlug || attribution?.placement),
    ...(category(attribution?.ctaLocation || attribution?.placement) ? { placement: category(attribution?.ctaLocation || attribution?.placement) } : {}),
  };
}

export function storedPaymentFunnelAttribution(value: unknown, fallbackTool: FunnelTool = "coin_topup"): FunnelAttributionSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { source: "unknown", landingClass: "other", tool: fallbackTool };
  }
  const record = value as Record<string, unknown>;
  return {
    source: typeof record.source === "string" && SOURCES.has(record.source as FunnelSource) ? record.source as FunnelSource : "unknown",
    landingClass: typeof record.landingClass === "string" && LANDING_CLASSES.has(record.landingClass as FunnelLandingClass) ? record.landingClass as FunnelLandingClass : "other",
    tool: typeof record.tool === "string" && TOOLS.has(record.tool as FunnelTool) ? record.tool as FunnelTool : fallbackTool,
    ...(category(record.placement) ? { placement: category(record.placement) } : {}),
  };
}

type FunnelEventDelegate = {
  create(args: { data: Record<string, unknown> }): Promise<unknown>;
  upsert(args: { where: { dedupeKey: string }; update: Record<string, never>; create: Record<string, unknown> }): Promise<unknown>;
  deleteMany(args: { where: { createdAt: { lt: Date } } }): Promise<{ count: number }>;
};

let lastPrunedAt = 0;

export async function recordFunnelEvent(input: FunnelEventInput) {
  const db = getDb() as unknown as { funnelEvent?: FunnelEventDelegate } | null;
  if (!db?.funnelEvent) return null;
  const data = {
    name: input.name,
    anonymousSessionId: input.anonymousSessionId || null,
    userId: input.userId || null,
    chartId: input.chartId || null,
    source: SOURCES.has(input.source) ? input.source : "unknown",
    landingClass: LANDING_CLASSES.has(input.landingClass) ? input.landingClass : "other",
    tool: TOOLS.has(input.tool) ? input.tool : "other",
    placement: category(input.placement) || null,
    resultBand: category(input.resultBand) || null,
    dedupeKey: input.dedupeKey?.slice(0, 190) || null,
    createdAt: input.createdAt || new Date(),
  };
  const saved = data.dedupeKey
    ? await db.funnelEvent.upsert({ where: { dedupeKey: data.dedupeKey }, update: {}, create: data })
    : await db.funnelEvent.create({ data });

  const now = Date.now();
  if (now - lastPrunedAt > 24 * 60 * 60 * 1000) {
    lastPrunedAt = now;
    await db.funnelEvent.deleteMany({
      where: { createdAt: { lt: new Date(now - FUNNEL_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000) } },
    }).catch(() => ({ count: 0 }));
  }
  return saved;
}

export async function recordFunnelEventBestEffort(input: FunnelEventInput) {
  try {
    return await recordFunnelEvent(input);
  } catch (error) {
    console.error("funnel_event_write_failed", {
      name: input.name,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function recordAccountFunnelEvent(userId: string, resultBand: string) {
  return recordFunnelEventBestEffort({
    name: "account",
    anonymousSessionId: await getServerFunnelSessionId(),
    userId,
    source: "unknown",
    landingClass: "other",
    tool: "chart",
    resultBand: category(resultBand),
  });
}

export function recordChartResultFunnelEvent(
  chartId: string,
  userId: string | undefined,
  metadata: ChartCreationMetadata,
  resultBand: string,
) {
  return recordFunnelEventBestEffort({
    name: "result",
    anonymousSessionId: metadata.funnelSessionId,
    userId,
    chartId,
    ...paymentFunnelAttribution(metadata.attribution),
    resultBand,
    dedupeKey: `result:${chartId}`,
  });
}

export function recordAttributedAccountFunnelEvent(
  userId: string,
  metadata: ChartCreationMetadata,
  resultBand: string,
) {
  return recordFunnelEventBestEffort({
    name: "account",
    anonymousSessionId: metadata.funnelSessionId,
    userId,
    ...paymentFunnelAttribution(metadata.attribution),
    resultBand,
  });
}
