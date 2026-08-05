import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(fileURLToPath(new URL("./la-so/[id]/page.tsx", import.meta.url)), "utf8");

describe("chart page data loading", () => {
  it("starts chart, session, and operation settings reads together", () => {
    expect(pageSource).toMatch(
      /const \[record, user, operationSettings\] = await Promise\.all\(\[\s*getChart\(id\),\s*getCurrentUser\(\),\s*getOperationSettings\(\),?\s*\]\);/,
    );
    expect(pageSource).not.toContain("const record = await getChart(id)");
    expect(pageSource.indexOf("if (!record) notFound();")).toBeGreaterThan(pageSource.indexOf("const [record, user, operationSettings]"));
  });

  it("resolves guarded independent viewer reads in one batch", () => {
    expect(pageSource).toMatch(
      /const \[featurePrices, selectedReadingCandidate, viewerFullReading, coinBalance\] = await Promise\.all\(\[[\s\S]*paidFeaturesVisible \? getFeaturePrices\(\) : Promise\.resolve\(null\),[\s\S]*canReadFullOverview && user && query\.reading && !isScopedReadingView[\s\S]*getReadingById\(user\.id, query\.reading\)[\s\S]*canReadFullOverview && user \? getViewerFullReading\(user, id\) : Promise\.resolve\(null\),[\s\S]*canReadFullOverview && user \? getUserBalance\(user\) : Promise\.resolve\(0\),[\s\S]*\]\);/,
    );
  });

  it("creates the viewer FULL lookup once and reuses it for reading and assistant access", () => {
    expect(pageSource).toContain("async function getViewerFullReading(user: SessionUser, chartId: string)");
    expect(pageSource).toContain('getCachedReading(user.id, chartId, "FULL", "all")');
    expect(pageSource).toContain('user.role === "ADMIN" ? await getAnyCompletedReading(chartId, "FULL", "all") : null');
    expect(pageSource.match(/getCachedReading\(/g)).toHaveLength(1);
    expect(pageSource.match(/getAnyCompletedReading\(/g)).toHaveLength(1);
    expect(pageSource.match(/getViewerFullReading\(user, id\)/g)).toHaveLength(1);
    expect(pageSource).toContain("const fullReading = isScopedReadingView ? null : viewerFullReading;");
    expect(pageSource).toContain("const assistantFullReading = viewerFullReading;");
  });

  it("waits for assistant history only after the single viewer FULL reading resolves", () => {
    const batchIndex = pageSource.indexOf("const [featurePrices, selectedReadingCandidate, viewerFullReading, coinBalance]");
    const historyIndex = pageSource.indexOf("const assistantHistory = user && assistantFullReading");

    expect(batchIndex).toBeGreaterThan(-1);
    expect(historyIndex).toBeGreaterThan(batchIndex);
    expect(pageSource).toContain("user && assistantFullReading ? await listAssistantQuestions(user.id, id) : []");
    expect(pageSource).not.toContain("fullReading ||");
  });
});
