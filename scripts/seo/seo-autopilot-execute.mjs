#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { buildSnapshot } from "./seo-autopilot-snapshot.mjs";
import { buildSearchConsoleInsights } from "./search-console.mjs";
import {
  extractSeedArticleSlugs,
  normalizePublisherSelection,
  planSeoAutopilotRun,
  readSemrushKeywordRows,
  renderContentDraft,
  renderRunReport,
} from "./seo-autopilot-core.mjs";
import { shouldSkipSearchConsole } from "./search-console-policy.mjs";

const args = parseArgs(process.argv.slice(2));
const baseUrl = normalizeBaseUrl(args.baseUrl || "https://lasotinhhoa.vn");
const sampleSize = Number.parseInt(args.sampleSize || "8", 10);
const publisherSelection = normalizePublisherSelection({
  articles: args.articles || args.articlesPerWeek || (args.cluster ? "5" : "7"),
  clusterMode: args.cluster,
});
const articlesPerWeek = publisherSelection.articles;
const dryRun = Boolean(args.dryRun);
const skipSearchConsole = shouldSkipSearchConsole({ explicitSkip: args.skipSearchConsole });

try {
  const generatedAt = new Date().toISOString();
  const snapshot = await buildSnapshot({ baseUrl, sampleSize });
  const existingSlugs = await readExistingSlugs();
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
    clusterMode: publisherSelection.clusterMode,
  });
  const draftPaths = plan.weeklyContentPlan.articles.map((article) =>
    resolve(process.cwd(), "docs/seo-autopilot/drafts", `${article.slug}.md`),
  );
  const reportPath = resolve(
    process.cwd(),
    "docs/seo-autopilot/reports",
    `${generatedAt.slice(0, 10)}-weekly-content-batch.md`,
  );
  const statePath = resolve(process.cwd(), "docs/seo-autopilot/state.json");
  const result = {
    generatedAt,
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
    artifacts: {
      draftPath: draftPaths[0] ? toRepoPath(draftPaths[0]) : null,
      draftPaths: draftPaths.map(toRepoPath),
      reportPath: toRepoPath(reportPath),
      statePath: toRepoPath(statePath),
    },
  };

  if (!dryRun) {
    for (const [index, article] of plan.weeklyContentPlan.articles.entries()) {
      await writeTextFile(draftPaths[index], renderContentDraft(article.brief, { generatedAt }));
    }
    await writeTextFile(reportPath, renderRunReport(result));
    await writeTextFile(
      statePath,
      `${JSON.stringify(
        {
          lastRunAt: generatedAt,
          lastStatus: plan.status,
          lastAction: plan.nextAction,
          lastKeywordSource: {
            sourcePath: keywordSource.sourcePath,
            rowCount: keywordSource.rows.length,
            warning: keywordSource.warning,
          },
          lastSearchConsole: summarizeSearchConsoleForState(searchConsole),
          lastDraftPaths: draftPaths.map(toRepoPath),
          lastReportPath: toRepoPath(reportPath),
          nextVerificationCommands: plan.verificationCommands,
        },
        null,
        2,
      )}\n`,
    );
  }

  const output = { ...result, dryRun };
  console.log(JSON.stringify(args.summaryJson ? summarizeExecutionOutput(output) : output, null, 2));
} catch (error) {
  console.error(`SEO Autopilot execute failed: ${error.message}`);
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

async function writeTextFile(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${content.trimEnd()}\n`, "utf8");
}

function toRepoPath(path) {
  return relative(process.cwd(), path).replace(/\\/g, "/");
}

function normalizeBaseUrl(value) {
  return String(value || "").replace(/\/$/, "");
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--dry-run") {
      parsed.dryRun = true;
    } else if (value === "--cluster") {
      parsed.cluster = true;
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
    } else if (value === "--summary-json") {
      parsed.summaryJson = true;
    }
  }
  return parsed;
}

function summarizeExecutionOutput(result) {
  const plan = result.plan;
  return {
    generatedAt: result.generatedAt,
    dryRun: result.dryRun,
    baseUrl: result.baseUrl,
    status: plan.status,
    warnings: result.snapshot?.warnings || [],
    seedArticleCount: result.contentInventory?.seedArticleCount,
    keywordSource: result.keywordSource,
    searchConsoleStatus: result.searchConsole?.status || (result.searchConsole ? "unknown" : "skipped"),
    nextAction: plan.nextAction,
    selectedArticles: plan.weeklyContentPlan?.articles?.map((article) => ({
      day: article.day,
      slug: article.slug,
      funnelStage: article.funnelStage,
      focusKeyword: article.focusKeyword,
      targetCharacterRange: article.brief.targetCharacterRange,
      coverAsset: article.brief.coverAssetRequirements,
    })) || [],
    qualityGate: {
      minDataEnrichmentBlocks: plan.brief?.uniqueValueRequirements?.minDataEnrichmentBlocks,
      requiredDataBlocks: plan.brief?.uniqueValueRequirements?.requiredDataBlocks,
      interactiveTarget: plan.brief?.uniqueValueRequirements?.interactiveElement?.targetLink,
      coverAssetPath: plan.brief?.coverAssetRequirements?.publicPath,
      programmaticGuardrailCount: plan.brief?.programmaticSeoGuardrails?.length || 0,
    },
    artifacts: result.artifacts,
    verificationCommands: plan.verificationCommands,
  };
}

function summarizeSearchConsoleForState(searchConsole) {
  if (!searchConsole) return { status: "skipped" };
  return {
    status: searchConsole.status,
    siteUrl: searchConsole.siteUrl,
    dateRange: searchConsole.dateRange,
    totals: searchConsole.totals,
    topOpportunities: searchConsole.opportunities?.slice(0, 5) || [],
    warnings: searchConsole.warnings || [],
  };
}
