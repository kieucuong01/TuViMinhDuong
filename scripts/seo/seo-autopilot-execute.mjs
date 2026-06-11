#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { buildSnapshot } from "./seo-autopilot-snapshot.mjs";
import { buildSearchConsoleInsights } from "./search-console.mjs";
import {
  extractSeedArticleSlugs,
  planSeoAutopilotRun,
  readSemrushKeywordRows,
  renderContentDraft,
  renderRunReport,
} from "./seo-autopilot-core.mjs";

const args = parseArgs(process.argv.slice(2));
const baseUrl = normalizeBaseUrl(args.baseUrl || "https://lasotinhhoa.vn");
const sampleSize = Number.parseInt(args.sampleSize || "8", 10);
const articlesPerWeek = clampArticleCount(args.articles || args.articlesPerWeek || "3");
const dryRun = Boolean(args.dryRun);

try {
  const generatedAt = new Date().toISOString();
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
      draftPath: toRepoPath(draftPaths[0]),
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

function clampArticleCount(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 3;
  return Math.min(Math.max(parsed, 1), 3);
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
    })) || [],
    qualityGate: {
      minDataEnrichmentBlocks: plan.brief?.uniqueValueRequirements?.minDataEnrichmentBlocks,
      requiredDataBlocks: plan.brief?.uniqueValueRequirements?.requiredDataBlocks,
      interactiveTarget: plan.brief?.uniqueValueRequirements?.interactiveElement?.targetLink,
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
