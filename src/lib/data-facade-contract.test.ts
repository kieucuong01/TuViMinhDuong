import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const facadePath = path.join(process.cwd(), "src", "lib", "data.ts");
const source = fs.readFileSync(facadePath, "utf8");

const expectedExports = [
  "AdminBusinessDashboard",
  "AdminChartSubmission",
  "AdminFunnelBreakdownRow",
  "AdminFunnelDashboard",
  "AdminFunnelStage",
  "AdminFunnelWindow",
  "AdminFunnelWindowDays",
  "AdminPaymentSource",
  "AdminRecentPayment",
  "AdminRecentUser",
  "AdminRevenueMetrics",
  "AdminTrendGroups",
  "AdminTrendPeriod",
  "AdminTrendPoint",
  "ArticleIndexEntry",
  "ArticleSummary",
  "ARTICLES_CACHE_TAG",
  "ChartCreationMetadata",
  "ChartHistoryItem",
  "DEFAULT_OPERATION_SETTINGS",
  "FEATURE_PRICES_CACHE_TAG",
  "FreeOverviewBlockProgress",
  "FreeOverviewGenerationClaim",
  "FreeOverviewStatus",
  "OPERATION_SETTINGS_CACHE_TAG",
  "OperationSettings",
  "ReadingScopeKey",
  "StoredReading",
  "StoredReadingProgress",
  "adjustCoins",
  "claimFreeOverviewBlockGeneration",
  "claimFreeOverviewGeneration",
  "claimGuestChartForCheckout",
  "claimGuestChartForUserFromPath",
  "completeReadingJob",
  "countRecentChartsForIp",
  "createPendingReading",
  "deleteArticleBySlug",
  "deleteUserChart",
  "failFreeOverviewGeneration",
  "failReadingJob",
  "generateAndStoreFreeOverview",
  "generateAndStoreFreeOverviewBlock",
  "getAdminArticleBySlug",
  "getAdminBusinessDashboard",
  "getAdminFunnelDashboard",
  "getAdminOverview",
  "getAnyCompletedReading",
  "getArticleBySlug",
  "getCachedReading",
  "getChart",
  "getCompletedReadingsForScopes",
  "getFeaturePrice",
  "getFeaturePrices",
  "getFreeOverviewStatus",
  "getOperationSettings",
  "getOrCreateFreeOverview",
  "getReadingById",
  "getReadingJobById",
  "getReadingJobByScope",
  "getReadingProgress",
  "getUserBalance",
  "hasReadingBundleAccess",
  "listAdminArticles",
  "listAdminChartSubmissions",
  "listArticleCategories",
  "listArticleIndex",
  "listArticleSummaries",
  "listArticles",
  "listUserCharts",
  "normalizeAdminTrendPeriod",
  "saveArticleCategoryFromForm",
  "saveArticleFromForm",
  "saveChart",
  "saveReading",
  "saveReadingProgress",
  "updateFeaturePrices",
  "updateOperationSettings",
  "updateReadingJobProgress",
].sort();

function facadeExports() {
  const file = ts.createSourceFile(facadePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  return file.statements.flatMap((statement) => {
    if (!ts.isExportDeclaration(statement) || !statement.exportClause || !ts.isNamedExports(statement.exportClause)) return [];
    return statement.exportClause.elements.map((element) => element.name.text);
  });
}

describe("data compatibility facade", () => {
  it("explicitly re-exports every established public symbol exactly once", () => {
    const exports = facadeExports();
    expect([...exports].sort()).toEqual(expectedExports);
    expect(new Set(exports).size).toBe(exports.length);
  });

  it("contains no persistence implementation or fallback state", () => {
    expect(source).not.toMatch(/\bgetDb\b|\bglobalThis\b|\bunstable_cache\b|\brevalidateTag\b/);
    expect(source).not.toMatch(/\.(findUnique|findMany|create|update|upsert|delete|count|\$transaction)\s*\(/);
    expect(source).not.toMatch(/^\s*(?:export\s+)?(?:async\s+)?function\s/m);
    expect(source.split(/\r?\n/).filter((line) => line.trim()).length).toBeLessThan(140);
  });

  it("keeps the established compatibility import path", () => {
    expect(source.trimStart().startsWith('import "server-only";')).toBe(true);
    expect(source).toContain('from "@/lib/data/charts"');
    expect(source).toContain('from "@/lib/data/contracts"');
  });
});
