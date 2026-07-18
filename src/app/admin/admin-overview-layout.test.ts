import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const adminPageSource = readFileSync(fileURLToPath(new URL("./page.tsx", import.meta.url)), "utf8");
const trendChartsSource = readFileSync(fileURLToPath(new URL("../../components/admin-trend-charts.tsx", import.meta.url)), "utf8");
const globalsCss = readFileSync(fileURLToPath(new URL("../globals.css", import.meta.url)), "utf8");

describe("admin overview layout", () => {
  it("keeps revenue inside the overview tab", () => {
    expect(adminPageSource).toContain("admin-overview-revenue");
    expect(adminPageSource).toContain("Doanh thu");
    expect(adminPageSource).not.toContain("activeTab === \"revenue\"");
    expect(adminPageSource).not.toContain("href: \"/admin?tab=revenue\"");
  });

  it("stacks overview charts and keeps chart data compact", () => {
    expect(trendChartsSource).toContain("admin-trend-table-panel compact");
    expect(trendChartsSource).toContain("admin-data-table admin-data-table-compact");
    expect(globalsCss).toMatch(/\.admin-trend-grid\s*{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(globalsCss).toContain(".admin-compact-chart-data");
  });

  it("adds scannable icon and tone treatments to overview metrics", () => {
    expect(adminPageSource).toContain("admin-report-metric-icon");
    expect(adminPageSource).toContain("tone: \"revenue\"");
    expect(globalsCss).toContain(".admin-report-metric-icon");
  });
});
