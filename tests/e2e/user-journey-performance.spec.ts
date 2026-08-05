import fs from "node:fs/promises";
import path from "node:path";
import { devices, expect, test, type Browser, type Page } from "@playwright/test";
import { summarize, type PerformanceSample } from "../../src/lib/performance-metrics";
import { createSmokeChart } from "./helpers";

type BrowserMetricState = {
  lcpMs: number;
  cls: number;
};

declare global {
  interface Window {
    __tuViPerformance?: BrowserMetricState;
  }
}

async function createColdMobilePage(browser: Browser, baseURL: string) {
  const context = await browser.newContext({
    ...devices["Pixel 5"],
    baseURL,
  });
  await context.addInitScript(() => {
    const state: BrowserMetricState = { lcpMs: 0, cls: 0 };
    window.__tuViPerformance = state;

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) state.lcpMs = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
        if (!shift.hadRecentInput) state.cls += shift.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });

  return { context, page: await context.newPage() };
}

async function captureSample(page: Page, route: PerformanceSample["route"]): Promise<PerformanceSample> {
  await page.waitForFunction(() => (window.__tuViPerformance?.lcpMs || 0) > 0, undefined, { timeout: 15_000 });
  await page.waitForTimeout(1_000);

  const result = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const state = window.__tuViPerformance;
    if (!navigation || !state?.lcpMs) throw new Error("Browser did not expose complete navigation/LCP metrics.");
    if (new URL(navigation.name).pathname !== window.location.pathname) {
      throw new Error("Performance capture requires a cold document navigation for the measured route.");
    }

    const initialJsBytes = performance.getEntriesByType("resource")
      .filter((entry) => (entry as PerformanceResourceTiming).initiatorType === "script")
      .reduce((total, entry) => {
        const resource = entry as PerformanceResourceTiming;
        return total + (resource.transferSize || resource.encodedBodySize);
      }, 0);

    return {
      lcpMs: state.lcpMs,
      cls: state.cls,
      ttfbMs: navigation.responseStart,
      htmlBytes: navigation.transferSize || navigation.encodedBodySize,
      initialJsBytes,
    };
  });

  return { route, ...result };
}

test("records three cold mobile samples for home and chart result", async ({ browser }, testInfo) => {
  test.setTimeout(300_000);
  const outputPath = process.env.PERF_OUTPUT_PATH;
  const phase = process.env.PERF_PHASE;
  const baseURL = String(testInfo.project.use.baseURL || "");
  if (!outputPath || !path.isAbsolute(outputPath)) throw new Error("PERF_OUTPUT_PATH must be an absolute path.");
  if (!phase) throw new Error("PERF_PHASE is required.");
  if (!baseURL) throw new Error("Playwright baseURL is required.");

  const samples: PerformanceSample[] = [];
  for (let index = 0; index < 3; index += 1) {
    const { context, page } = await createColdMobilePage(browser, baseURL);
    try {
      await page.goto("/");
      await expect(page.getByTestId("chart-form")).toBeVisible();
      samples.push(await captureSample(page, "home"));
    } finally {
      await context.close();
    }
  }

  for (let index = 0; index < 3; index += 1) {
    const creation = await createColdMobilePage(browser, baseURL);
    let chartId = "";
    try {
      const chart = await createSmokeChart(creation.page, `Performance Test ${phase} ${index + 1} ${Date.now()}`);
      chartId = chart.id;
    } finally {
      await creation.context.close();
    }

    const result = await createColdMobilePage(browser, baseURL);
    try {
      await result.page.goto(`/la-so/${chartId}`);
      await expect(result.page.getByTestId("chart-page")).toBeVisible();
      samples.push(await captureSample(result.page, "chart-result"));
    } finally {
      await result.context.close();
    }
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify({
    phase,
    generatedAt: new Date().toISOString(),
    summaries: summarize(samples),
    samples,
  }, null, 2), "utf8");
});
