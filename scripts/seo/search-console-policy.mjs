#!/usr/bin/env node

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LAUNCH_DATE_ISO = "2026-06-14";
const DEFAULT_GRACE_DAYS = 60;

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDays(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function shouldSkipSearchConsole({ explicitSkip = false, now = new Date() } = {}) {
  if (explicitSkip) return true;

  const skipUntil = parseDate(process.env.SEO_GSC_SKIP_UNTIL);
  if (skipUntil && now <= skipUntil) return true;

  const launchDate = parseDate(process.env.SEO_GSC_LAUNCH_DATE || DEFAULT_LAUNCH_DATE_ISO);
  const graceDays = parseDays(process.env.SEO_GSC_GRACE_DAYS || String(DEFAULT_GRACE_DAYS));
  if (!launchDate || !graceDays) return false;

  const skipWindowEnd = new Date(launchDate.getTime() + graceDays * DAY_IN_MS);
  return now <= skipWindowEnd;
}
