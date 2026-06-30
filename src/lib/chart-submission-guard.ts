export const CHART_CREATION_RATE_LIMIT = 20;
export const CHART_CREATION_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export type ChartNameValidationResult =
  | { ok: true; fullName: string }
  | { ok: false; reason: "empty" | "too_long" | "suspicious" };

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
  /^[A-Za-z0-9]{8,}$/,
];

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
