#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildSnapshot } from "./seo-autopilot-snapshot.mjs";
import { buildSearchConsoleInsights } from "./search-console.mjs";
import {
  extractSeedArticleSlugs,
  planSeoAutopilotRun,
  readSemrushKeywordRows,
  renderRunReport,
} from "./seo-autopilot-core.mjs";
import { shouldSkipSearchConsole } from "./search-console-policy.mjs";

const args = parseArgs(process.argv.slice(2));
const baseUrl = normalizeBaseUrl(args.baseUrl || "https://lasotinhhoa.vn");
const sampleSize = Number.parseInt(args.sampleSize || "8", 10);
const articlesPerWeek = clampArticleCount(args.articles || args.articlesPerWeek || "7");
const skipSearchConsole = shouldSkipSearchConsole({ explicitSkip: args.skipSearchConsole });

try {
  const snapshot = await buildSnapshot({ baseUrl, sampleSize });
  const existingSlugs = await readExistingSlugs();
  const contentInventory = buildContentInventory({ existingSlugs, snapshot });
  const previousState = await readPreviousState();
  const keywordSource = readSemrushKeywordRows({ csvPath: args.keywordCsv });
  const searchConsole = skipSearchConsole
    ? null
    : await buildSearchConsoleInsights({ siteUrl: args.gscSiteUrl || `${baseUrl}/` });
  const plan = planSeoAutopilotRun({
    snapshot,
    existingSlugs,
    keywordRows: keywordSource.rows,
    searchConsole,
    articlesPerWeek,
    previousState,
  });
  const result = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    snapshot,
    contentInventory,
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
    console.log(renderRunReport(result));
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

async function readPreviousState() {
  const statePath = resolve(process.cwd(), "docs/seo-autopilot/state.json");
  try {
    const source = await readFile(statePath, "utf8");
    return JSON.parse(source);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function buildContentInventory({ existingSlugs, snapshot }) {
  const productionSlugs = snapshot?.knowledgeArticleSlugs || [];
  const combinedSlugs = [...new Set([...existingSlugs, ...productionSlugs])];
  return {
    seedArticleCount: existingSlugs.length,
    existingSlugs,
    productionArticleCount: productionSlugs.length,
    productionSlugs,
    combinedArticleCount: combinedSlugs.length,
    combinedSlugs,
  };
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
  if (!Number.isFinite(parsed)) return 7;
  return Math.min(Math.max(parsed, 1), 7);
}
