import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const DEFAULT_SITE_URL = "https://lasotinhhoa.vn/";
const DEFAULT_CLIENT_PATHS = [
  join(homedir(), ".codex", "secrets", "lasotinhhoa-gsc-oauth-client.json"),
  join(homedir(), ".codex", "secrets", "bandothanso-gsc-oauth-client.json"),
];
const DEFAULT_TOKEN_PATHS = [
  join(homedir(), ".codex", "secrets", "lasotinhhoa-gsc-token.json"),
  join(homedir(), ".codex", "secrets", "bandothanso-gsc-token.json"),
];

export async function buildSearchConsoleInsights({
  siteUrl = process.env.SEO_GSC_SITE_URL || DEFAULT_SITE_URL,
  clientPath = process.env.SEO_GSC_CLIENT_PATH,
  tokenPath = process.env.SEO_GSC_TOKEN_PATH,
  days = 28,
  endLagDays = 3,
  rowLimit = 25,
  fetchImpl = fetch,
} = {}) {
  const dateRange = finalizedDateRange({ days, endLagDays });
  try {
    const credentials = await readSearchConsoleCredentials({ clientPath, tokenPath });
    const accessToken = await refreshAccessToken({ credentials, fetchImpl });
    const selectedSiteUrl = await resolveAccessibleSiteUrl({ siteUrl, accessToken, dateRange, fetchImpl });
    const [overview, pages, queries, pageQueries] = await Promise.all([
      querySearchAnalytics({ siteUrl: selectedSiteUrl, accessToken, dateRange, dimensions: [], rowLimit: 1, fetchImpl }),
      querySearchAnalytics({ siteUrl: selectedSiteUrl, accessToken, dateRange, dimensions: ["page"], rowLimit, fetchImpl }),
      querySearchAnalytics({ siteUrl: selectedSiteUrl, accessToken, dateRange, dimensions: ["query"], rowLimit, fetchImpl }),
      querySearchAnalytics({
        siteUrl: selectedSiteUrl,
        accessToken,
        dateRange,
        dimensions: ["page", "query"],
        rowLimit: rowLimit * 4,
        fetchImpl,
      }),
    ]);

    return {
      status: "ok",
      siteUrl: selectedSiteUrl,
      requestedSiteUrl: siteUrl,
      dateRange,
      source: "google-search-console",
      totals: summarizeRows(overview.rows || []),
      topPages: mapRows(pages.rows || [], ["page"]),
      topQueries: mapRows(queries.rows || [], ["query"]),
      pageQueries: mapRows(pageQueries.rows || [], ["page", "query"]),
      opportunities: deriveSearchConsoleOpportunities({
        pages: mapRows(pages.rows || [], ["page"]),
        queries: mapRows(queries.rows || [], ["query"]),
        pageQueries: mapRows(pageQueries.rows || [], ["page", "query"]),
      }),
      warnings: [],
    };
  } catch (error) {
    return {
      status: "unavailable",
      siteUrl,
      dateRange,
      source: "google-search-console",
      totals: emptyMetrics(),
      topPages: [],
      topQueries: [],
      pageQueries: [],
      opportunities: [],
      warnings: [safeErrorMessage(error)],
    };
  }
}

export async function readSearchConsoleCredentials({ clientPath, tokenPath } = {}) {
  const resolvedClientPath = resolveExistingPath(clientPath, DEFAULT_CLIENT_PATHS);
  const resolvedTokenPath = resolveExistingPath(tokenPath, DEFAULT_TOKEN_PATHS);
  if (!resolvedClientPath || !resolvedTokenPath) {
    throw new Error("Search Console OAuth client or token file was not found.");
  }

  const clientJson = JSON.parse(await readFile(resolvedClientPath, "utf8"));
  const tokenJson = JSON.parse(await readFile(resolvedTokenPath, "utf8"));
  const client = clientJson.installed || clientJson.web || clientJson;

  if (!client.client_id || !client.client_secret || !tokenJson.refresh_token) {
    throw new Error("Search Console OAuth files are missing client_id, client_secret, or refresh_token.");
  }

  return {
    clientId: client.client_id,
    clientSecret: client.client_secret,
    tokenUri: client.token_uri || "https://oauth2.googleapis.com/token",
    refreshToken: tokenJson.refresh_token,
    scope: tokenJson.scope || "",
    clientPath: resolvedClientPath,
    tokenPath: resolvedTokenPath,
  };
}

export async function refreshAccessToken({ credentials, fetchImpl = fetch }) {
  const body = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    refresh_token: credentials.refreshToken,
    grant_type: "refresh_token",
  });
  const response = await fetchImpl(credentials.tokenUri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    throw new Error(`OAuth refresh failed: ${data.error_description || data.error || response.status}`);
  }
  return data.access_token;
}

export async function querySearchAnalytics({
  siteUrl,
  accessToken,
  dateRange,
  dimensions = [],
  rowLimit = 25,
  fetchImpl = fetch,
}) {
  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const response = await fetchImpl(
    `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        dimensions,
        type: "web",
        rowLimit,
      }),
    },
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Search Console query failed: ${data.error?.message || response.status}`);
  }
  return data;
}

export async function listSearchConsoleSites({ accessToken, fetchImpl = fetch }) {
  const response = await fetchImpl("https://www.googleapis.com/webmasters/v3/sites", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Search Console sites list failed: ${data.error?.message || response.status}`);
  }
  return data.siteEntry || [];
}

export function deriveSearchConsoleOpportunities({ pages = [], queries = [], pageQueries = [] } = {}) {
  const weakCtrPages = pages
    .filter((row) => row.impressions >= 20 && row.ctr < 0.02)
    .slice(0, 5)
    .map((row) => ({
      type: "refresh-title-meta",
      reason: "High impressions with weak CTR.",
      page: row.page,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));

  const strikingDistanceQueries = queries
    .filter((row) => row.impressions >= 20 && row.position >= 8 && row.position <= 20)
    .slice(0, 8)
    .map((row) => ({
      type: "expand-supporting-content",
      reason: "Query is visible but not yet top-page competitive.",
      query: row.query,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));

  const pageQueryRefreshes = pageQueries
    .filter((row) => row.impressions >= 10 && row.position >= 5 && row.ctr < 0.03)
    .slice(0, 8)
    .map((row) => ({
      type: "refresh-page-section",
      reason: "Page-query pair has impressions but needs a stronger answer or snippet.",
      page: row.page,
      query: row.query,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));

  return [...weakCtrPages, ...strikingDistanceQueries, ...pageQueryRefreshes];
}

function resolveExistingPath(explicitPath, candidates) {
  if (explicitPath && existsSync(explicitPath)) return explicitPath;
  return candidates.find((path) => existsSync(path)) || null;
}

async function resolveAccessibleSiteUrl({ siteUrl, accessToken, dateRange, fetchImpl }) {
  const candidates = siteUrlCandidates(siteUrl);
  const errors = [];
  for (const candidate of candidates) {
    try {
      await querySearchAnalytics({
        siteUrl: candidate,
        accessToken,
        dateRange,
        dimensions: [],
        rowLimit: 1,
        fetchImpl,
      });
      return candidate;
    } catch (error) {
      errors.push(`${candidate}: ${error.message}`);
    }
  }

  let matchingSites = [];
  try {
    const sites = await listSearchConsoleSites({ accessToken, fetchImpl });
    matchingSites = sites
      .map((site) => site.siteUrl)
      .filter((value) => normalizeSiteHost(value) === normalizeSiteHost(siteUrl));
  } catch {
    matchingSites = [];
  }

  const hint = matchingSites.length
    ? `Matching accessible properties found but query failed: ${matchingSites.join(", ")}.`
    : "No accessible Search Console property matched lasotinhhoa.vn for this OAuth token.";
  throw new Error(`${hint} Tried ${candidates.join(", ")}. Last error: ${errors.at(-1) || "unknown"}`);
}

function siteUrlCandidates(siteUrl) {
  const normalized = String(siteUrl || DEFAULT_SITE_URL).trim();
  const host = normalizeSiteHost(normalized);
  const candidates = [
    normalized,
    normalized.endsWith("/") ? normalized.slice(0, -1) : `${normalized}/`,
    `sc-domain:${host}`,
    `https://${host}/`,
    `https://www.${host}/`,
    `http://${host}/`,
    `http://www.${host}/`,
  ];
  return [...new Set(candidates.filter(Boolean))];
}

function normalizeSiteHost(value) {
  const text = String(value || "").trim();
  if (text.startsWith("sc-domain:")) return text.replace("sc-domain:", "").replace(/^www\./, "");
  try {
    return new URL(text).hostname.replace(/^www\./, "");
  } catch {
    return text.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
  }
}

function finalizedDateRange({ days, endLagDays }) {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - endLagDays);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - Math.max(1, days - 1));
  return {
    startDate: toDateString(start),
    endDate: toDateString(end),
  };
}

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function mapRows(rows, dimensions) {
  return rows.map((row) => {
    const item = normalizeMetrics(row);
    for (const [index, dimension] of dimensions.entries()) {
      item[dimension] = row.keys?.[index] || "";
    }
    return item;
  });
}

function summarizeRows(rows) {
  if (!rows.length) return emptyMetrics();
  return normalizeMetrics(rows[0]);
}

function normalizeMetrics(row) {
  return {
    clicks: Math.round(Number(row.clicks || 0) * 100) / 100,
    impressions: Math.round(Number(row.impressions || 0) * 100) / 100,
    ctr: roundRate(row.ctr || 0),
    position: Math.round(Number(row.position || 0) * 100) / 100,
  };
}

function emptyMetrics() {
  return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
}

function roundRate(value) {
  return Math.round(Number(value || 0) * 10000) / 10000;
}

function safeErrorMessage(error) {
  return String(error?.message || error || "Search Console unavailable").replace(
    /(client_secret=|refresh_token=|access_token=)[^&\s]+/gi,
    "$1[redacted]",
  );
}
