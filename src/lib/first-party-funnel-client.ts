"use client";

import type { FunnelEventName, FunnelLandingClass, FunnelSource, FunnelTool } from "@/lib/funnel-events";

type ClientContextInput = {
  pathname: string;
  search?: string;
  referrer?: string;
  sourceSlug?: string;
};

type ClientFunnelContext = {
  source: FunnelSource;
  landingClass: FunnelLandingClass;
  tool: FunnelTool;
};

type FunnelStage = Extract<FunnelEventName, "landing" | "tool_view" | "submit" | "result" | "save_intent">;
type ClientFunnelDetails = {
  tool?: string;
  sourceSlug?: string;
  placement?: string;
  resultBand?: string;
};

const SESSION_KEY = "lsth-funnel-session";
const CONTEXT_KEY = "lsth-funnel-context";
const REPORTED_PREFIX = "lsth-funnel-reported";
const AI_SOURCES = new Set(["chatgpt", "chatgpt.com", "openai", "gemini", "perplexity", "claude", "copilot"]);
const PAID_MEDIUMS = new Set(["cpc", "paid", "ppc", "paid_search", "paid-social", "paid_social"]);
const SEARCH_HOSTS = ["google.", "bing.", "coccoc.", "yahoo.", "duckduckgo."];

function category(value?: string | null) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
  return normalized.slice(0, 64) || undefined;
}

function clientLandingClass(pathname: string): FunnelLandingClass {
  if (pathname === "/") return "home";
  if (pathname === "/tu-vi-tai-loc-dau-tu") return "wealth_tool";
  if (pathname === "/tuong-hop-la-so") return "compatibility_tool";
  if (pathname === "/xem-ngay" || pathname.startsWith("/xem-ngay/")) return "date_tool";
  if (pathname === "/xem-tuoi" || pathname.startsWith("/xem-tuoi/")) return "age_tool";
  if (pathname === "/kien-thuc-tu-vi" || pathname.startsWith("/kien-thuc-tu-vi/") || pathname.startsWith("/tra-cuu")) return "knowledge";
  if (/^\/la-so\/[^/]+/.test(pathname)) return "chart_result";
  if (pathname === "/pricing" || pathname === "/nap-xu") return "pricing";
  return "other";
}

function clientTool(value?: string | null, pathname = ""): FunnelTool {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized.includes("vo-chong")) return "age_compatibility";
  if (normalized.includes("sinh-con")) return "age_child";
  if (normalized.includes("xay-nha")) return "age_house";
  if (normalized.includes("lam-an")) return "age_business";
  if (normalized.includes("cuoi-hoi")) return "age_marriage";
  if (normalized.includes("mua-xe")) return "age_vehicle";
  if (normalized.includes("tai-loc") || normalized === "wealth" || pathname === "/tu-vi-tai-loc-dau-tu") return "wealth";
  if (normalized.includes("tuong-hop") || normalized === "compatibility" || pathname === "/tuong-hop-la-so") return "compatibility";
  if (normalized.includes("xem-ngay") || normalized === "date_finder" || pathname.startsWith("/xem-ngay")) return "date_finder";
  if (normalized === "full" || normalized.includes("full_reading")) return "full_reading";
  if (normalized.includes("nap-xu") || normalized === "coin_topup") return "coin_topup";
  if (pathname === "/" || pathname.startsWith("/lap-la-so") || pathname.startsWith("/la-so/")) return "chart";
  if (pathname.startsWith("/kien-thuc-tu-vi") || pathname.startsWith("/tra-cuu")) return "knowledge";
  return "other";
}

function hostname(value?: string) {
  try {
    return value ? new URL(value).hostname.replace(/^www\./, "").toLowerCase() : "";
  } catch {
    return "";
  }
}

export function classifyClientFunnelContext(input: ClientContextInput): ClientFunnelContext {
  const params = new URLSearchParams(input.search || "");
  const sourceParam = (params.get("utm_source") || params.get("source") || "").toLowerCase();
  const medium = (params.get("utm_medium") || "").toLowerCase();
  const host = hostname(input.referrer);
  const source: FunnelSource = PAID_MEDIUMS.has(medium)
    ? "ads"
    : AI_SOURCES.has(sourceParam) || ["chatgpt.com", "openai.com", "perplexity.ai", "claude.ai"].some((item) => host === item || host.endsWith(`.${item}`))
      ? "ai"
      : sourceParam === "seo_article" || sourceParam === "tool" || host === "lasotinhhoa.vn"
        ? "internal"
        : SEARCH_HOSTS.some((item) => host.includes(item))
          ? "organic_search"
          : host
            ? "referral"
            : "direct";

  return {
    source,
    landingClass: clientLandingClass(input.pathname),
    tool: clientTool(input.sourceSlug || params.get("source_slug") || params.get("entry_article"), input.pathname),
  };
}

export function organicEventFunnelStage(name: string): FunnelStage | null {
  if (name.endsWith("_tool_view") || name === "age_tool_view") return "tool_view";
  if (name.endsWith("_submit") || name.endsWith("_submitted")) return "submit";
  if (name.endsWith("_result")) return "result";
  if (name.endsWith("_chart_cta") || name.endsWith("_next_step")) return "save_intent";
  return null;
}

function uuid() {
  return globalThis.crypto?.randomUUID?.() || "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (digit) =>
    (Number(digit) ^ Math.floor(Math.random() * 16) >> Number(digit) / 4).toString(16),
  );
}

function sessionId() {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = uuid();
    window.sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return uuid();
  }
}

function currentContext(details: ClientFunnelDetails): ClientFunnelContext {
  const pathname = window.location?.pathname || "/";
  const current = classifyClientFunnelContext({
    pathname,
    search: window.location?.search || "",
    referrer: typeof document === "undefined" ? "" : document.referrer,
    sourceSlug: details.sourceSlug || details.tool,
  });
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(CONTEXT_KEY) || "null") as ClientFunnelContext | null;
    if (current.source !== "direct" || !stored) {
      window.sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(current));
      return current;
    }
    return stored;
  } catch {
    return current;
  }
}

export function reportFirstPartyFunnelEvent(stage: FunnelStage, details: ClientFunnelDetails = {}) {
  if (typeof window === "undefined") return;
  const pathname = window.location?.pathname || "/";
  const context = currentContext(details);
  const tool = clientTool(details.tool || details.sourceSlug, pathname) || context.tool;
  const placement = category(details.placement);
  const resultBand = category(details.resultBand);
  const dedupe = `${REPORTED_PREFIX}:${stage}:${pathname}:${tool}:${placement || ""}:${resultBand || ""}`;
  try {
    if (window.sessionStorage.getItem(dedupe)) return;
    window.sessionStorage.setItem(dedupe, "1");
  } catch {}

  if (typeof globalThis.fetch !== "function") return;
  void globalThis.fetch("/api/analytics/funnel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    keepalive: true,
    body: JSON.stringify({
      name: stage,
      eventId: uuid(),
      anonymousSessionId: sessionId(),
      source: context.source,
      landingClass: context.landingClass,
      tool: tool === "other" ? context.tool : tool,
      ...(placement ? { placement } : {}),
      ...(resultBand ? { resultBand } : {}),
    }),
  }).catch(() => undefined);
}

export function reportOrganicToolFunnelEvent(name: string, params: Record<string, string | number | boolean | undefined>) {
  const stage = organicEventFunnelStage(name);
  if (!stage) return;
  reportFirstPartyFunnelEvent(stage, {
    tool: typeof params.tool === "string" ? params.tool : name.split("_")[0],
    placement: typeof params.placement === "string" ? params.placement : typeof params.cta_position === "string" ? params.cta_position : undefined,
    resultBand: typeof params.result_band === "string"
      ? params.result_band
      : typeof params.result_level === "string"
        ? params.result_level
        : typeof params.entry_state === "string"
          ? params.entry_state
          : undefined,
  });
}
