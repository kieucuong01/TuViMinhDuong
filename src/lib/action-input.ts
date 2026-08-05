import type { ChartInput } from "@/lib/chart";
import type { OperationSettings } from "@/lib/data/contracts";
import { FEATURE_PRICE_KEYS, type ReadingKey } from "@/lib/pricing";

export type ReadingRequestInput = {
  chartId: string;
  type: ReadingKey;
  scopeKey: string;
  nextPath: string;
};

export type ReadingBundleInput = {
  chartId: string;
  type: ReadingKey;
  nextPath: string;
};

export function safeNextPath(value: FormDataEntryValue | null, fallback: string) {
  const next = String(value || fallback);
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export function parseChartActionInput(formData: FormData): ChartInput {
  return {
    fullName: String(formData.get("fullName") || ""),
    gender: String(formData.get("gender") || "male") as ChartInput["gender"],
    calendarType: String(formData.get("calendarType") || "solar") as ChartInput["calendarType"],
    day: Number(formData.get("day") || 1),
    month: Number(formData.get("month") || 1),
    year: Number(formData.get("year") || 1990),
    birthHour: Number(formData.get("birthHour") || 0),
    birthMinute: Number(formData.get("birthMinute") || 0),
    viewYear: Number(formData.get("viewYear") || new Date().getFullYear()),
    timezone: "Asia/Bangkok",
  };
}

export function parseReadingRequestInput(formData: FormData): ReadingRequestInput {
  const chartId = String(formData.get("chartId") || "");
  return {
    chartId,
    type: String(formData.get("type") || "FULL") as ReadingKey,
    scopeKey: String(formData.get("scopeKey") || "all"),
    nextPath: safeNextPath(formData.get("next"), `/la-so/${chartId}`),
  };
}

export function parseReadingBundleInput(formData: FormData): ReadingBundleInput {
  const chartId = String(formData.get("chartId") || "");
  return {
    chartId,
    type: String(formData.get("type") || "") as ReadingKey,
    nextPath: safeNextPath(formData.get("next"), `/la-so/${chartId}`),
  };
}

export function parseOperationSettingsInput(formData: FormData): Omit<OperationSettings, "updatedAt"> {
  const mode = String(formData.get("mode") || "custom");
  if (mode === "basic-free") {
    return { paymentsEnabled: false, coinTopupEnabled: false, paidReadingsEnabled: false };
  }
  if (mode === "commercial") {
    return { paymentsEnabled: true, coinTopupEnabled: true, paidReadingsEnabled: true };
  }
  return {
    paymentsEnabled: formData.get("paymentsEnabled") === "1",
    coinTopupEnabled: formData.get("coinTopupEnabled") === "1",
    paidReadingsEnabled: formData.get("paidReadingsEnabled") === "1",
  };
}

export function parseFeaturePriceUpdates(formData: FormData) {
  return FEATURE_PRICE_KEYS.map((key) => ({
    key,
    priceCoins: Number(formData.get(`priceCoins:${key}`)),
  }));
}
