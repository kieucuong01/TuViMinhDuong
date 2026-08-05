import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = path.resolve("src");

function source(relativePath: string) {
  return readFileSync(path.join(sourceRoot, relativePath), "utf8");
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (["generated", "node_modules"].includes(entry.name)) return [];
      return sourceFiles(absolute);
    }
    return /\.(?:ts|tsx)$/.test(entry.name) && !/\.test\.(?:ts|tsx)$/.test(entry.name) ? [absolute] : [];
  });
}

function resolveAliasImport(specifier: string) {
  if (!specifier.startsWith("@/")) return null;
  const base = path.join(sourceRoot, specifier.slice(2));
  const candidates = [`${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")];
  return candidates.find((candidate) => existsSync(candidate)) || null;
}

function importGraph() {
  const graph = new Map<string, string[]>();
  const importPattern = /(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s+)?["'](@\/[^"']+)["']/g;
  for (const file of sourceFiles(sourceRoot)) {
    const dependencies: string[] = [];
    for (const match of readFileSync(file, "utf8").matchAll(importPattern)) {
      const resolved = resolveAliasImport(match[1]);
      if (resolved) dependencies.push(resolved);
    }
    graph.set(file, [...new Set(dependencies)]);
  }
  return graph;
}

function importCycles(graph: Map<string, string[]>) {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];
  const cycles: string[][] = [];
  function visit(file: string) {
    if (visiting.has(file)) {
      const start = stack.indexOf(file);
      cycles.push([...stack.slice(start), file]);
      return;
    }
    if (visited.has(file)) return;
    visiting.add(file);
    stack.push(file);
    for (const dependency of graph.get(file) || []) visit(dependency);
    stack.pop();
    visiting.delete(file);
    visited.add(file);
  }
  for (const file of graph.keys()) visit(file);
  return cycles;
}

describe("P2C roadmap module boundaries", () => {
  it("keeps the production source import graph acyclic", () => {
    expect(importCycles(importGraph())).toEqual([]);
  });

  it("keeps payment reconciliation policy free of routes and global DB access", () => {
    const reconciliation = source("lib/payment-reconciliation.ts");
    expect(reconciliation).not.toMatch(/@\/app\/|@\/lib\/db|@\/lib\/payos|server-only/);
    expect(reconciliation).toContain("classifyPayOSReconciliation");
    expect(reconciliation).toContain("reconcileStalePaymentOrders");
  });

  it("separates funnel validation/write, report aggregation, and presentation", () => {
    const events = source("lib/funnel-events.ts");
    const report = source("lib/funnel-report.ts");
    const adminPage = source("app/admin/page.tsx");
    expect(events).toContain("parseClientFunnelEvent");
    expect(events).toContain("recordFunnelEvent");
    expect(events).not.toContain("buildAdminFunnelDashboard");
    expect(report).toContain("buildAdminFunnelDashboard");
    expect(report).not.toContain("getDb(");
    expect(adminPage).toContain("<AdminFunnelPanel");
    expect(adminPage).not.toContain("function BreakdownTable");
  });

  it("keeps article read models dedicated and presentation types off the broad data barrel", () => {
    const dataFacade = source("lib/data.ts");
    const articles = source("lib/data/articles.ts");
    const funnelPanel = source("components/admin-funnel-panel.tsx");
    const hygienePanel = source("components/admin-payment-hygiene-panel.tsx");
    expect(dataFacade).toMatch(/export\s*\{[\s\S]*listArticleIndex,[\s\S]*listArticleSummaries,[\s\S]*\}\s*from "@\/lib\/data\/articles"/);
    expect(articles).toContain("readArticleIndexFromDb");
    expect(articles).toContain("readArticleSummariesFromDb");
    expect(articles).toContain("readArticleBySlugFromDb");
    expect(funnelPanel).toContain('from "@/lib/data/contracts"');
    expect(hygienePanel).toContain('from "@/lib/data/contracts"');
  });
});
