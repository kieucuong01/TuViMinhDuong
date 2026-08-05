import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const dataDirectory = path.join(projectRoot, "src", "lib", "data");

function read(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function importSpecifiers(filePath: string) {
  const source = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  return sourceFile.statements.flatMap((statement) => {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) return [];
    return [statement.moduleSpecifier.text];
  });
}

function exportedDeclarations(filePath: string) {
  const source = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const names = new Set<string>();
  for (const statement of sourceFile.statements) {
    const modifiers = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) : undefined;
    const isExported = modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
    if (isExported && ts.isFunctionDeclaration(statement) && statement.name) {
      names.add(statement.name.text);
    }
    if (isExported && ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
      }
    }
    if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) names.add(element.name.text);
    }
  }
  return names;
}

describe("data module boundaries", () => {
  it("provides shared contracts and one process-wide demo store", () => {
    const contractsPath = path.join(dataDirectory, "contracts.ts");
    const demoStorePath = path.join(dataDirectory, "demo-store.ts");

    expect(fs.existsSync(contractsPath)).toBe(true);
    expect(fs.existsSync(demoStorePath)).toBe(true);

    const demoStoreSource = fs.readFileSync(demoStorePath, "utf8");
    expect(demoStoreSource.match(/globalThis/g)).toHaveLength(1);
    expect(demoStoreSource).not.toMatch(/^const\s+\w+\s*=\s*new Map/m);
  });

  it("keeps domain modules from importing back through the compatibility facade", () => {
    if (!fs.existsSync(dataDirectory)) throw new Error("src/lib/data directory is missing");
    const domainFiles = fs.readdirSync(dataDirectory)
      .filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts"))
      .map((name) => path.join(dataDirectory, name));

    for (const filePath of domainFiles) {
      expect(importSpecifiers(filePath), path.basename(filePath)).not.toContain("@/lib/data");
      expect(importSpecifiers(filePath), path.basename(filePath)).not.toContain("../data");
    }
  });

  it("keeps the compatibility facade server-only", () => {
    expect(read("src/lib/data.ts").trimStart().startsWith('import "server-only";')).toBe(true);
  });

  it("owns chart persistence in the chart domain and re-exports its public API", () => {
    const chartsPath = path.join(dataDirectory, "charts.ts");
    const expected = [
      "countRecentChartsForIp",
      "saveChart",
      "claimGuestChartForCheckout",
      "claimGuestChartForUserFromPath",
      "getChart",
      "listUserCharts",
      "deleteUserChart",
    ];

    expect(fs.existsSync(chartsPath)).toBe(true);
    const owned = exportedDeclarations(chartsPath);
    const facadeExports = exportedDeclarations(path.join(projectRoot, "src", "lib", "data.ts"));
    for (const name of expected) {
      expect(owned.has(name), `${name} should be owned by charts.ts`).toBe(true);
      expect(facadeExports.has(name), `${name} should remain exported by data.ts`).toBe(true);
    }

    expect(importSpecifiers(chartsPath)).not.toEqual(expect.arrayContaining([
      "./free-overview",
      "./readings",
      "./articles",
      "./settings",
      "./admin",
      "@/lib/data",
    ]));
  });

  it("owns free overview generation in its domain and re-exports its public API", () => {
    const freeOverviewPath = path.join(dataDirectory, "free-overview.ts");
    const expected = [
      "getFreeOverviewStatus",
      "claimFreeOverviewGeneration",
      "claimFreeOverviewBlockGeneration",
      "failFreeOverviewGeneration",
      "generateAndStoreFreeOverviewBlock",
      "generateAndStoreFreeOverview",
      "getOrCreateFreeOverview",
    ];

    expect(fs.existsSync(freeOverviewPath)).toBe(true);
    const owned = exportedDeclarations(freeOverviewPath);
    const facadeExports = exportedDeclarations(path.join(projectRoot, "src", "lib", "data.ts"));
    for (const name of expected) {
      expect(owned.has(name), `${name} should be owned by free-overview.ts`).toBe(true);
      expect(facadeExports.has(name), `${name} should remain exported by data.ts`).toBe(true);
    }

    expect(importSpecifiers(freeOverviewPath)).not.toEqual(expect.arrayContaining([
      "./readings",
      "./articles",
      "./settings",
      "./admin",
      "@/lib/data",
    ]));
  });

  it("owns pricing and operation settings in the settings domain", () => {
    const settingsPath = path.join(dataDirectory, "settings.ts");
    const cachePath = path.join(dataDirectory, "cache.ts");
    const expected = [
      "OPERATION_SETTINGS_CACHE_TAG",
      "FEATURE_PRICES_CACHE_TAG",
      "DEFAULT_OPERATION_SETTINGS",
      "getFeaturePrice",
      "getFeaturePrices",
      "updateFeaturePrices",
      "getOperationSettings",
      "updateOperationSettings",
    ];

    expect(fs.existsSync(settingsPath)).toBe(true);
    expect(fs.existsSync(cachePath)).toBe(true);
    const owned = exportedDeclarations(settingsPath);
    const facadeExports = exportedDeclarations(path.join(projectRoot, "src", "lib", "data.ts"));
    for (const name of expected) {
      expect(owned.has(name), `${name} should be owned by settings.ts`).toBe(true);
      expect(facadeExports.has(name), `${name} should remain exported by data.ts`).toBe(true);
    }

    expect(importSpecifiers(settingsPath)).not.toEqual(expect.arrayContaining([
      "./admin",
      "./articles",
      "./charts",
      "./free-overview",
      "./readings",
      "@/lib/data",
    ]));
    expect(importSpecifiers(cachePath)).not.toEqual(expect.arrayContaining([
      "./admin",
      "./articles",
      "./charts",
      "./free-overview",
      "./readings",
      "./settings",
      "@/lib/data",
    ]));
  });

  it("owns reading, balance, bundle and progress persistence in the reading domain", () => {
    const readingsPath = path.join(dataDirectory, "readings.ts");
    const expected = [
      "getUserBalance",
      "adjustCoins",
      "getCachedReading",
      "hasReadingBundleAccess",
      "getAnyCompletedReading",
      "getReadingJobByScope",
      "getReadingJobById",
      "getReadingProgress",
      "saveReadingProgress",
      "createPendingReading",
      "updateReadingJobProgress",
      "completeReadingJob",
      "failReadingJob",
      "getCompletedReadingsForScopes",
      "getReadingById",
      "saveReading",
    ];

    expect(fs.existsSync(readingsPath)).toBe(true);
    const owned = exportedDeclarations(readingsPath);
    const facadeExports = exportedDeclarations(path.join(projectRoot, "src", "lib", "data.ts"));
    for (const name of expected) {
      expect(owned.has(name), `${name} should be owned by readings.ts`).toBe(true);
      expect(facadeExports.has(name), `${name} should remain exported by data.ts`).toBe(true);
    }

    expect(importSpecifiers(readingsPath)).not.toEqual(expect.arrayContaining([
      "./admin",
      "./articles",
      "@/lib/data",
      "@/app/actions",
    ]));
  });

  it("owns article and CMS persistence in the article domain", () => {
    const articlesPath = path.join(dataDirectory, "articles.ts");
    const expected = [
      "ARTICLES_CACHE_TAG",
      "listArticles",
      "listArticleIndex",
      "listAdminArticles",
      "getArticleBySlug",
      "getAdminArticleBySlug",
      "deleteArticleBySlug",
      "listArticleCategories",
      "saveArticleCategoryFromForm",
      "saveArticleFromForm",
    ];

    expect(fs.existsSync(articlesPath)).toBe(true);
    const owned = exportedDeclarations(articlesPath);
    const facadeExports = exportedDeclarations(path.join(projectRoot, "src", "lib", "data.ts"));
    for (const name of expected) {
      expect(owned.has(name), `${name} should be owned by articles.ts`).toBe(true);
      expect(facadeExports.has(name), `${name} should remain exported by data.ts`).toBe(true);
    }

    expect(importSpecifiers(articlesPath)).not.toEqual(expect.arrayContaining([
      "./admin",
      "./charts",
      "./free-overview",
      "./readings",
      "./settings",
      "@/lib/data",
    ]));
  });

  it("owns admin reporting and normalization in the admin domain", () => {
    const adminPath = path.join(dataDirectory, "admin.ts");
    const expected = [
      "normalizeAdminTrendPeriod",
      "getAdminBusinessDashboard",
      "listAdminChartSubmissions",
      "getAdminOverview",
    ];

    expect(fs.existsSync(adminPath)).toBe(true);
    const owned = exportedDeclarations(adminPath);
    const facadeExports = exportedDeclarations(path.join(projectRoot, "src", "lib", "data.ts"));
    for (const name of expected) {
      expect(owned.has(name), `${name} should be owned by admin.ts`).toBe(true);
      expect(facadeExports.has(name), `${name} should remain exported by data.ts`).toBe(true);
    }

    expect(importSpecifiers(adminPath)).not.toEqual(expect.arrayContaining([
      "@/lib/data",
      "@/app/actions",
    ]));
    expect(importSpecifiers(path.join(dataDirectory, "settings.ts"))).not.toContain("./admin");
  });
});
