import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const componentPath = fileURLToPath(new URL("./chart-retention-panel.tsx", import.meta.url));
const retentionSource = existsSync(componentPath) ? readFileSync(componentPath, "utf8") : "";
const chartPageSource = readFileSync(fileURLToPath(new URL("../app/la-so/[id]/page.tsx", import.meta.url)), "utf8");
const datePageSource = readFileSync(fileURLToPath(new URL("../app/xem-ngay/page.tsx", import.meta.url)), "utf8");
const dateViewSource = readFileSync(fileURLToPath(new URL("./date-view.tsx", import.meta.url)), "utf8");
const globalsSource = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

describe("ChartRetentionPanel", () => {
  it("creates a return loop from the chart result page", () => {
    expect(retentionSource).toContain("chart-retention-panel");
    expect(retentionSource).toContain("Đăng nhập để lưu lá số");
    expect(retentionSource).toContain("Nguyệt vận");
    expect(retentionSource).toContain("xem ngày theo tuổi");
    expect(retentionSource).toContain("birthYear");
    expect(retentionSource).toContain("loginModalHref");
  });

  it("appears before deeper chart actions so users see the loop early", () => {
    expect(chartPageSource).toContain("ChartRetentionPanel");
    expect(chartPageSource).not.toContain("ChartReadingRoadmap");
    expect(chartPageSource.indexOf("<ChartRetentionPanel")).toBeLessThan(chartPageSource.indexOf("<MobileChartReader"));
    expect(chartPageSource.indexOf("<ChartRetentionPanel")).toBeLessThan(chartPageSource.indexOf("<DeferredChartActionPanel"));
  });

  it("passes the chart birth year into date fortune from the URL", () => {
    expect(datePageSource).toContain("birthYear?: string | string[]");
    expect(datePageSource).toContain("initialBirthYear={query.birthYear}");
    expect(dateViewSource).toContain("initialBirthYear");
    expect(dateViewSource).toContain("safeBirthYear");
  });

  it("has a responsive visual treatment", () => {
    expect(globalsSource).toContain(".chart-retention-panel");
    expect(globalsSource).toContain(".chart-retention-grid");
    expect(globalsSource).toContain(".chart-retention-card");
  });
});
