import type { ChartInput } from "@/lib/chart";
import { lunarToSolar, solarToLunar } from "@/lib/lunar";

export const CHART_CREATION_RATE_LIMIT = 20;
export const CHART_CREATION_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export type ChartNameValidationResult =
  | { ok: true; fullName: string }
  | { ok: false; reason: "empty" | "too_long" | "suspicious" };

export type ChartSubmissionInputValidationResult =
  | { ok: true }
  | { ok: false; reason: "invalid_date" | "invalid_input" };

const SUSPICIOUS_CHART_NAME_PATTERNS = [
  /sleep\s*\(/i,
  /pg_sleep\s*\(/i,
  /sysdate\s*\(/i,
  /benchmark\s*\(/i,
  /waitfor\s+delay/i,
  /dbms_pipe|receive_message/i,
  /union\s+select/i,
  /information_schema/i,
  /\/etc\/passwd/i,
  /<script/i,
  /onerror\s*=/i,
  /\bor\s+[0-9]+[\s+*=()-]/i,
  /%2527|%2522/i,
  /^@@[A-Za-z0-9]{5,}$/i,
  /^-1\b/i,
];

const CHART_BIRTH_HOURS = new Set([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]);

export function normalizeChartFullName(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function validateChartFullName(value: unknown): ChartNameValidationResult {
  const fullName = normalizeChartFullName(value);
  if (!fullName) return { ok: false, reason: "empty" };
  if (fullName.length > 80) return { ok: false, reason: "too_long" };
  if (SUSPICIOUS_CHART_NAME_PATTERNS.some((pattern) => pattern.test(fullName))) {
    return { ok: false, reason: "suspicious" };
  }
  return { ok: true, fullName };
}

function isValidSolarDate(input: ChartInput) {
  const date = new Date(Date.UTC(input.year, input.month - 1, input.day));
  return date.getUTCFullYear() === input.year && date.getUTCMonth() === input.month - 1 && date.getUTCDate() === input.day;
}

function isValidLunarDate(input: ChartInput) {
  if (input.day > 30) return false;
  const solar = lunarToSolar(input.day, input.month, input.year, false, 7);
  const roundTrip = solarToLunar(solar.day, solar.month, solar.year, 7);
  return roundTrip.day === input.day && roundTrip.month === input.month && roundTrip.year === input.year && !roundTrip.leap;
}

export function validateChartSubmissionInput(input: ChartInput): ChartSubmissionInputValidationResult {
  const currentYear = new Date().getFullYear();
  const numericFields = [input.day, input.month, input.year, input.birthHour, input.birthMinute ?? 0, input.viewYear];
  if (numericFields.some((value) => !Number.isInteger(value))) return { ok: false, reason: "invalid_input" };
  if (input.gender !== "male" && input.gender !== "female") return { ok: false, reason: "invalid_input" };
  if (input.calendarType !== "solar" && input.calendarType !== "lunar") return { ok: false, reason: "invalid_input" };
  if (input.year < 1900 || input.year > currentYear) return { ok: false, reason: "invalid_input" };
  if (input.viewYear < 1900 || input.viewYear > 2100) return { ok: false, reason: "invalid_input" };
  if (input.month < 1 || input.month > 12) return { ok: false, reason: "invalid_date" };
  if (input.day < 1 || input.day > 31) return { ok: false, reason: "invalid_date" };
  if (!CHART_BIRTH_HOURS.has(input.birthHour)) return { ok: false, reason: "invalid_input" };
  if ((input.birthMinute ?? 0) < 0 || (input.birthMinute ?? 0) > 59) return { ok: false, reason: "invalid_input" };

  const validDate = input.calendarType === "solar" ? isValidSolarDate(input) : isValidLunarDate(input);
  return validDate ? { ok: true } : { ok: false, reason: "invalid_date" };
}

export function normalizeRequestIp(value: string | null | undefined) {
  const first = String(value || "").split(",")[0]?.trim() || "";
  if (!first) return undefined;
  return first.replace(/^::ffff:/i, "").slice(0, 64);
}

export function normalizeUserAgent(value: string | null | undefined) {
  const userAgent = String(value || "").replace(/\s+/g, " ").trim();
  return userAgent ? userAgent.slice(0, 500) : undefined;
}

export function chartCreationRateLimitWindowStart(now = new Date()) {
  return new Date(now.getTime() - CHART_CREATION_RATE_LIMIT_WINDOW_MS);
}

export function chartCreationRateLimitExceeded(recentCount: number, limit = CHART_CREATION_RATE_LIMIT) {
  return recentCount >= limit;
}
