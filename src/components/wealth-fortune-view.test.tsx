import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { generateTuViChart } from "@/lib/chart";
import { CHART_FIXTURES } from "@/lib/chart.fixtures";

const viewSource = readFileSync(fileURLToPath(new URL("./wealth-fortune-view.tsx", import.meta.url)), "utf8");

describe("WealthFortuneView", () => {
  it("keeps the wealth report server-rendered and accessible", () => {
    expect(viewSource).not.toContain('"use client"');
    expect(viewSource).toContain("buildWealthFortuneReport");
    expect(viewSource).toContain('role="img"');
    expect(viewSource).toContain("<table");
    expect(viewSource).toContain("Chỉ số định hướng");
    expect(viewSource).toContain("không thay thế tư vấn tài chính");
  });

  it("renders a titled trend graphic and five-row table fallback", async () => {
    const { WealthFortuneView } = await import("./wealth-fortune-view");
    const chart = generateTuViChart(CHART_FIXTURES[0].input);

    const html = renderToStaticMarkup(createElement(WealthFortuneView, { chartId: "chart-1", chart }));

    expect(html).toContain('role="img"');
    expect(html).toContain("Chỉ số định hướng");
    expect(html).toContain("Bảng chỉ số định hướng 5 năm");
    expect((html.match(/<tr/g) ?? []).length).toBe(6);
    expect(html).toContain("không thay thế tư vấn tài chính");
  });
});
