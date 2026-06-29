import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const widgetSource = readFileSync(fileURLToPath(new URL("./assistant-widget.tsx", import.meta.url)), "utf8");
const deferredSource = readFileSync(fileURLToPath(new URL("./deferred-assistant-widget.tsx", import.meta.url)), "utf8");
const chartPageSource = readFileSync(fileURLToPath(new URL("../app/la-so/[id]/page.tsx", import.meta.url)), "utf8");
const globalStyles = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

describe("assistant entitlement UI", () => {
  it("renders server-owned access and remaining quota", () => {
    expect(widgetSource).toContain('status: "login-required" | "full-required" | "ready" | "exhausted"');
    expect(widgetSource).toContain("Còn {access.remaining}/3 câu hỏi");
    expect(widgetSource).toContain("setAccess");
    expect(widgetSource).toContain("data.remaining");
    expect(widgetSource).toContain("data.history");
    expect(widgetSource).toContain("Mở Hồ sơ VIP");
  });

  it("passes serializable access state from the chart server page", () => {
    expect(deferredSource).toContain("initialAccess");
    expect(deferredSource).toContain("<AssistantWidget chartId={chartId} initialAccess={initialAccess}");
    expect(chartPageSource).toContain("buildPersonalizedReportOutline(record.chart)");
    expect(chartPageSource).toContain("listAssistantQuestions");
    expect(chartPageSource).toContain("<PersonalizedReportOutline");
    expect(chartPageSource).toContain('id="mo-khoa-ho-so-vip"');
    expect(globalStyles).not.toMatch(
      /\.chart-page \.assistant-widget\s*\{\s*display:\s*none\s*!important;\s*\}/,
    );
  });
});
