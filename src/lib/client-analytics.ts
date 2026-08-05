"use client";

export type OrganicToolEventName =
  | "date_finder_submitted"
  | "date_finder_result_selected"
  | "birth_hour_compare_submitted"
  | "birth_hour_candidate_selected"
  | "age_tool_view"
  | "age_tool_submit"
  | "age_tool_result"
  | "age_tool_related_click"
  | "age_tool_chart_cta"
  | "compatibility_tool_view"
  | "compatibility_submit"
  | "compatibility_result"
  | "compatibility_edit"
  | "compatibility_evidence_open"
  | "compatibility_chart_cta"
  | "wealth_tool_view"
  | "wealth_submit"
  | "wealth_result"
  | "wealth_evidence_click"
  | "wealth_next_step";

export type AnalyticsParamValue = string | number | boolean | undefined;

type OrganicToolEvent = {
  name: OrganicToolEventName;
  params: Record<string, AnalyticsParamValue>;
};

type OrganicDataset = Partial<Record<
  "organicSubmit" | "organicPlacement" | "organicClick" | "organicTargetPalace",
  string
>>;

const ALLOWED_PARAM_KEYS: Record<OrganicToolEventName, ReadonlySet<string>> = {
  date_finder_submitted: new Set(["task", "range_days", "has_birth_year"]),
  date_finder_result_selected: new Set(["task", "rank", "score_band"]),
  birth_hour_compare_submitted: new Set(),
  birth_hour_candidate_selected: new Set(["hour_branch"]),
  age_tool_view: new Set(["tool"]),
  age_tool_submit: new Set(["tool"]),
  age_tool_result: new Set(["tool", "result_band"]),
  age_tool_related_click: new Set(["tool", "target_tool"]),
  age_tool_chart_cta: new Set(["tool", "cta_position"]),
  compatibility_tool_view: new Set(),
  compatibility_submit: new Set(),
  compatibility_result: new Set(["result_level"]),
  compatibility_edit: new Set(),
  compatibility_evidence_open: new Set(["theme_key", "result_level"]),
  compatibility_chart_cta: new Set(["cta_position"]),
  wealth_tool_view: new Set(),
  wealth_submit: new Set(["placement"]),
  wealth_result: new Set(["entry_state"]),
  wealth_evidence_click: new Set(["target_palace"]),
  wealth_next_step: new Set(["next_step", "target_palace"]),
};

const WEALTH_PLACEMENTS = new Set(["wealth_landing_form"]);
const WEALTH_PALACES = new Set(["tai_bach", "quan_loc", "thien_di"]);

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function ensureGtagQueue() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    // eslint-disable-next-line prefer-rest-params -- gtag.js consumes an Arguments object from the queue.
    window.dataLayer?.push(arguments);
  };
  return window.gtag;
}

function safeParams(name: OrganicToolEventName, params: Record<string, AnalyticsParamValue>) {
  const allowed = ALLOWED_PARAM_KEYS[name];
  return Object.fromEntries(
    Object.entries(params).filter(([key, value]) => value !== undefined && allowed.has(key)),
  );
}

export function organicToolRouteEvent(pathname: string, searchParams: Pick<URLSearchParams, "get">): OrganicToolEvent | null {
  if (pathname === "/tu-vi-tai-loc-dau-tu") {
    return { name: "wealth_tool_view", params: {} };
  }

  if (/^\/la-so\/[^/]+$/.test(pathname) && searchParams.get("view") === "tai-loc") {
    return {
      name: "wealth_result",
      params: { entry_state: searchParams.get("created") === "1" ? "created" : "return" },
    };
  }

  return null;
}

export function organicToolSubmitEvent(dataset: OrganicDataset): OrganicToolEvent | null {
  if (dataset.organicSubmit !== "wealth_submit" || !dataset.organicPlacement || !WEALTH_PLACEMENTS.has(dataset.organicPlacement)) {
    return null;
  }
  return { name: "wealth_submit", params: { placement: dataset.organicPlacement } };
}

export function organicToolClickEvents(dataset: OrganicDataset): OrganicToolEvent[] {
  if (dataset.organicClick !== "wealth_evidence_click" || !dataset.organicTargetPalace || !WEALTH_PALACES.has(dataset.organicTargetPalace)) {
    return [];
  }
  return [
    { name: "wealth_evidence_click", params: { target_palace: dataset.organicTargetPalace } },
    { name: "wealth_next_step", params: { next_step: "palace_reference", target_palace: dataset.organicTargetPalace } },
  ];
}

export function trackOrganicToolEvent(name: OrganicToolEventName, params: Record<string, AnalyticsParamValue> = {}) {
  if (typeof window === "undefined") return;
  ensureGtagQueue()("event", name, {
    event_category: "organic_tools",
    ...safeParams(name, params),
  });
}
