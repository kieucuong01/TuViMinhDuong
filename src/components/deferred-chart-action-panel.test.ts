import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const chartPageSource = readFileSync(fileURLToPath(new URL("../app/la-so/[id]/page.tsx", import.meta.url)), "utf8");
const deferredPanelSource = readFileSync(fileURLToPath(new URL("./deferred-chart-action-panel.tsx", import.meta.url)), "utf8");
const roadmapSource = readFileSync(fileURLToPath(new URL("./chart-reading-roadmap.tsx", import.meta.url)), "utf8");
const retentionSource = readFileSync(fileURLToPath(new URL("./chart-retention-panel.tsx", import.meta.url)), "utf8");
const fateTabsSource = readFileSync(fileURLToPath(new URL("./fate-tabs.tsx", import.meta.url)), "utf8");

describe("DeferredChartActionPanel", () => {
  it("keeps the canvas-heavy chart action panel out of the chart page initial bundle", () => {
    expect(chartPageSource).toContain("DeferredChartActionPanel");
    expect(chartPageSource).not.toContain('from "@/components/chart-action-panel"');
    expect(deferredPanelSource).toContain('dynamic(() => import("@/components/chart-action-panel")');
    expect(deferredPanelSource).toContain("IntersectionObserver");
  });

  it("turns off prefetch for dynamic chart-reader links near the first viewport", () => {
    expect(roadmapSource.match(/prefetch={false}/g)?.length).toBeGreaterThanOrEqual(4);
    expect(retentionSource.match(/prefetch={false}/g)?.length).toBeGreaterThanOrEqual(3);
    expect(fateTabsSource).toContain("prefetch={false}");
  });
});
