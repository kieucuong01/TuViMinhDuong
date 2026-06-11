#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildSnapshot } from "./seo-autopilot-snapshot.mjs";
import { buildSearchConsoleInsights } from "./search-console.mjs";
import {
  extractSeedArticleSlugs,
  planSeoAutopilotRun,
  readSemrushKeywordRows,
} from "./seo-autopilot-core.mjs";

const args = parseArgs(process.argv.slice(2));
const baseUrl = normalizeBaseUrl(args.baseUrl || "https://lasotinhhoa.vn");
const sampleSize = Number.parseInt(args.sampleSize || "8", 10);
const articlesPerWeek = clampArticleCount(args.articles || args.articlesPerWeek || "3");

try {
  const snapshot = await buildSnapshot({ baseUrl, sampleSize });
  const existingSlugs = await readExistingSlugs();
  const keywordSource = readSemrushKeywordRows({ csvPath: args.keywordCsv });
  const searchConsole = args.skipSearchConsole
    ? null
    : await buildSearchConsoleInsights({ siteUrl: args.gscSiteUrl || `${baseUrl}/` });
  const plan = planSeoAutopilotRun({
    snapshot,
    existingSlugs,
    keywordRows: keywordSource.rows,
    searchConsole,
    articlesPerWeek,
  });
  const result = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    snapshot,
    contentInventory: {
      seedArticleCount: existingSlugs.length,
      existingSlugs,
    },
    keywordSource: {
      sourcePath: keywordSource.sourcePath,
      rowCount: keywordSource.rows.length,
      warning: keywordSource.warning,
    },
    searchConsole,
    plan,
  };

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatMarkdown(result));
  }
} catch (error) {
  console.error(`SEO Autopilot plan failed: ${error.message}`);
  process.exitCode = 1;
}

async function readExistingSlugs() {
  const contentPath = resolve(process.cwd(), "src/lib/content.ts");
  const source = await readFile(contentPath, "utf8");
  return extractSeedArticleSlugs(source);
}

function formatMarkdown(result) {
  const { snapshot, plan } = result;
  return [
    "# SEO Autopilot Plan",
    "",
    `- Status: ${plan.status}`,
    `- Mode: ${plan.mode}`,
    `- Sitemap URLs: ${snapshot.sitemapUrlCount}`,
    `- Seed articles: ${result.contentInventory.seedArticleCount}`,
    "",
    "## Next Action",
    `- Type: ${plan.nextAction.type}`,
    `- Slug: ${plan.nextAction.slug}`,
    `- Approval required: ${plan.nextAction.approvalRequired ? "yes" : "no"}`,
    `- Reason: ${plan.nextAction.reason}`,
    "",
    "## Keyword Intelligence",
    keywordSourceLine(result),
    ...(plan.keywordIntelligence?.clusters?.slice(0, 5).map(
      (cluster) =>
        `- ${cluster.label}: ${cluster.keywordCount} keywords, volume ${cluster.totalVolume}, avg KD ${cluster.averageKd}, pillar \`${cluster.pillarSlug}\``,
    ) || ["- SEMrush CSV not found; using built-in topic opportunities."]),
    "",
    "## Search Console",
    searchConsoleLine(result.searchConsole),
    ...(result.searchConsole?.opportunities?.slice(0, 5).map(formatSearchConsoleOpportunity) || []),
    "",
    "## Brief",
    `- Focus keyword: ${plan.brief.focusKeyword}`,
    `- Title: ${plan.brief.title}`,
    `- Meta title: ${plan.brief.metaTitle}`,
    `- Meta description: ${plan.brief.metaDescription}`,
    `- Target characters: ${plan.brief.targetCharacterRange.min}-${plan.brief.targetCharacterRange.max}`,
    "",
    "## Weekly Content Batch",
    ...plan.weeklyContentPlan.articles.map(
      (article) =>
        `- ${article.day}: ${article.slug} (${article.funnelStage}, ${article.brief.targetCharacterRange.min}-${article.brief.targetCharacterRange.max} chars)`,
    ),
    "",
    "## Google Quality Policy",
    ...plan.brief.googleQualityPolicy.map((item) => `- ${item}`),
    "",
    "## Outline",
    ...plan.brief.outline.map((item) => `- ${item}`),
    "",
    "## Internal Links",
    ...plan.brief.internalLinks.map((item) => `- ${item}`),
    "",
    "## Verification",
    ...plan.verificationCommands.map((item) => `- ${item}`),
  ].join("\n");
}

function normalizeBaseUrl(value) {
  return String(value || "").replace(/\/$/, "");
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--json") {
      parsed.json = true;
    } else if (value === "--base-url") {
      parsed.baseUrl = values[index + 1];
      index += 1;
    } else if (value === "--sample-size") {
      parsed.sampleSize = values[index + 1];
      index += 1;
    } else if (value === "--articles" || value === "--articles-per-week") {
      parsed.articles = values[index + 1];
      index += 1;
    } else if (value === "--keyword-csv") {
      parsed.keywordCsv = values[index + 1];
      index += 1;
    } else if (value === "--gsc-site-url") {
      parsed.gscSiteUrl = values[index + 1];
      index += 1;
    } else if (value === "--skip-search-console") {
      parsed.skipSearchConsole = true;
    }
  }
  return parsed;
}

function clampArticleCount(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 3;
  return Math.min(Math.max(parsed, 1), 3);
}

function keywordSourceLine(result) {
  const source = result.keywordSource;
  if (!source?.sourcePath) return `- Source: unavailable (${source?.warning || "not configured"})`;
  return `- Source: ${source.sourcePath} (${source.rowCount} rows)`;
}

function searchConsoleLine(searchConsole) {
  if (!searchConsole) return "- Skipped by flag.";
  if (searchConsole.status !== "ok") {
    return `- Status: unavailable (${searchConsole.warnings?.[0] || "unknown"})`;
  }
  const totals = searchConsole.totals;
  return `- Status: ok, range ${searchConsole.dateRange.startDate} to ${searchConsole.dateRange.endDate}, clicks ${totals.clicks}, impressions ${totals.impressions}, CTR ${(totals.ctr * 100).toFixed(2)}%, avg position ${totals.position}`;
}

function formatSearchConsoleOpportunity(item) {
  const target = item.page || item.query || "unknown";
  return `- ${item.type}: ${target} (${item.impressions} impressions, CTR ${(item.ctr * 100).toFixed(2)}%, position ${item.position})`;
}
