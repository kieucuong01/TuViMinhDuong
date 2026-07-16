"use client";

type OrganicToolEventName =
  | "date_finder_submitted"
  | "date_finder_result_selected"
  | "birth_hour_compare_submitted"
  | "birth_hour_candidate_selected"
  | "age_tool_view"
  | "age_tool_submit"
  | "age_tool_result"
  | "age_tool_related_click"
  | "age_tool_chart_cta";

type AnalyticsParamValue = string | number | boolean | undefined;

const BLOCKED_PARAM_KEYS = new Set([
  "birthYear",
  "birth_year",
  "year",
  "month",
  "day",
  "birthDate",
  "birth_date",
  "fullName",
  "full_name",
  "name",
  "gender",
  "sex",
  "lunarYear",
  "lunar_year",
  "canChi",
  "can_chi",
]);

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function safeParams(params: Record<string, AnalyticsParamValue>) {
  return Object.fromEntries(
    Object.entries(params).filter(([key, value]) => value !== undefined && !BLOCKED_PARAM_KEYS.has(key)),
  );
}

export function trackOrganicToolEvent(name: OrganicToolEventName, params: Record<string, AnalyticsParamValue> = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, {
    event_category: "organic_tools",
    ...safeParams(params),
  });
}
