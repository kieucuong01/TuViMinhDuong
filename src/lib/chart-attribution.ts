export type ChartAttributionSource =
  | "ads"
  | "organic_search"
  | "ai"
  | "internal"
  | "referral"
  | "direct"
  | "unknown";

export type ChartAttribution = {
  source: ChartAttributionSource;
  label: string;
  confidence: "high" | "medium" | "low";
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
  referrerHost?: string;
  landingPath?: string;
  placement?: string;
};

export type ChartAttributionInput = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  sourceParam?: string | null;
  referrer?: string | null;
  landingPath?: string | null;
  placement?: string | null;
};

const PAID_MEDIUMS = new Set(["cpc", "paid", "ppc", "paid_search", "paid-social", "paid_social"]);
const SEARCH_HOSTS = ["google.", "bing.", "coccoc.", "yahoo.", "duckduckgo."];
const AI_SOURCES = new Set(["chatgpt", "chatgpt.com", "openai", "gemini", "perplexity", "claude", "copilot"]);
const AI_HOSTS = ["chatgpt.com", "openai.com", "gemini.google.com", "perplexity.ai", "claude.ai", "copilot.microsoft.com"];
const INTERNAL_SOURCES = new Set(["seo_article", "date_finder", "xem_tuoi_vo_chong", "xem_tuoi_sinh_con", "pseo_inline"]);
const INTERNAL_HOSTS = new Set(["lasotinhhoa.vn", "www.lasotinhhoa.vn"]);
const STORED_SOURCES = new Set<ChartAttributionSource>(["ads", "organic_search", "ai", "internal", "referral", "direct", "unknown"]);

function clean(value?: string | null, max = 160) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, max) : undefined;
}

function cleanKey(value?: string | null) {
  return clean(value, 120)?.toLowerCase();
}

function referrerHost(referrer?: string | null) {
  const value = clean(referrer, 500);
  if (!value) return undefined;
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase().slice(0, 120);
  } catch {
    return undefined;
  }
}

function isAiHost(host?: string) {
  return Boolean(host && AI_HOSTS.some((item) => host === item || host.endsWith(`.${item}`)));
}

function labelForSource(source: ChartAttributionSource) {
  if (source === "ads") return "Ads";
  if (source === "organic_search") return "Search";
  if (source === "ai") return "AI";
  if (source === "internal") return "Nội bộ";
  if (source === "referral") return "Referral";
  if (source === "direct") return "Direct";
  return "Chưa rõ";
}

export function displayChartAttributionSource(input: { source?: string | null; utmSource?: string | null; referrerHost?: string | null } = {}) {
  const source = cleanKey(input.source);
  const utmSource = cleanKey(input.utmSource);
  const host = cleanKey(input.referrerHost);
  const knownSource = source && STORED_SOURCES.has(source as ChartAttributionSource) ? (source as ChartAttributionSource) : undefined;

  if (knownSource && knownSource !== "unknown") return { source: knownSource, label: labelForSource(knownSource) };
  if (AI_SOURCES.has(source || "") || AI_SOURCES.has(utmSource || "") || isAiHost(host)) return { source: "ai" as const, label: "AI" };
  if (INTERNAL_SOURCES.has(source || "") || INTERNAL_SOURCES.has(utmSource || "") || (host && INTERNAL_HOSTS.has(host))) return { source: "internal" as const, label: "Nội bộ" };
  if (host && SEARCH_HOSTS.some((item) => host.includes(item))) return { source: "organic_search" as const, label: "Search" };
  if (host) return { source: "referral" as const, label: "Referral" };
  if (knownSource === "unknown" || source || utmSource) return { source: "unknown" as const, label: "Chưa rõ" };
  return { source: "direct" as const, label: "Direct" };
}

function utm(input: ChartAttributionInput) {
  const result = {
    source: cleanKey(input.utmSource),
    medium: cleanKey(input.utmMedium),
    campaign: clean(input.utmCampaign),
    content: clean(input.utmContent),
    term: clean(input.utmTerm),
  };
  return Object.values(result).some(Boolean) ? result : undefined;
}

function detail(base: Omit<ChartAttribution, "utm" | "referrerHost" | "landingPath" | "placement">, input: ChartAttributionInput): ChartAttribution {
  return {
    ...base,
    ...(utm(input) ? { utm: utm(input) } : {}),
    ...(referrerHost(input.referrer) ? { referrerHost: referrerHost(input.referrer) } : {}),
    ...(clean(input.landingPath, 220) ? { landingPath: clean(input.landingPath, 220) } : {}),
    ...(clean(input.placement, 120) ? { placement: clean(input.placement, 120) } : {}),
  };
}

export function normalizeChartAttribution(input: ChartAttributionInput = {}): ChartAttribution {
  const normalizedUtm = utm(input);
  const medium = normalizedUtm?.medium || "";
  const source = normalizedUtm?.source || cleanKey(input.sourceParam) || "";
  const host = referrerHost(input.referrer);
  const placement = cleanKey(input.placement);
  const landingPath = clean(input.landingPath, 220) || "";

  if (PAID_MEDIUMS.has(medium) || ["gclid", "gbraid", "wbraid"].some((key) => landingPath.includes(`${key}=`)) || (landingPath.startsWith("/lap-la-so") && placement === "google_ads_landing")) {
    return detail({ source: "ads", label: "Ads", confidence: "high" }, input);
  }

  if (AI_SOURCES.has(source) || isAiHost(host)) {
    return detail({ source: "ai", label: "AI", confidence: source ? "high" : "medium" }, input);
  }

  if (INTERNAL_SOURCES.has(source) || (host && INTERNAL_HOSTS.has(host))) {
    return detail({ source: "internal", label: "Nội bộ", confidence: source ? "high" : "medium" }, {
      ...input,
      placement: input.placement || source,
    });
  }

  if (host && SEARCH_HOSTS.some((item) => host.includes(item))) {
    return detail({ source: "organic_search", label: "Search", confidence: "medium" }, input);
  }

  if (host) return detail({ source: "referral", label: "Referral", confidence: "low" }, input);
  if (normalizedUtm || source) return detail({ source: "unknown", label: "Chưa rõ", confidence: "low" }, input);
  return detail({ source: "direct", label: "Direct", confidence: "low" }, input);
}
