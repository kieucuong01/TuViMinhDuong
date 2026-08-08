import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generateTuViChart } from "@/lib/chart";
import { CHART_FIXTURES } from "@/lib/chart.fixtures";
import { YearlyFortune2026View } from "@/components/yearly-fortune-2026-view";

describe("YearlyFortune2026View", () => {
  it("renders a readable annual story, practical timeline, and chart evidence", () => {
    const chart = generateTuViChart({ ...CHART_FIXTURES[0].input, viewYear: 2026 });
    const html = renderToStaticMarkup(createElement(YearlyFortune2026View, {
      chartId: "chart-2026",
      chart,
    }));

    expect(html).toContain("Tử vi năm 2026 của");
    expect(html).toContain("Bức tranh chung");
    expect(html).toContain("Công việc và hướng phát triển");
    expect(html).toContain("Tài chính và cách giữ nguồn lực");
    expect(html).toContain("Nhịp 12 tháng");
    expect(html).toContain("Căn cứ lá số");
    expect(html).toContain("Chỉ mang tính tham khảo");
    expect(html).toContain("data-chart-id=\"chart-2026\"");
    expect(html).toContain("data-organic-click=\"annual_2026_related_tool_click\"");
  });

  it("exposes the annual result as a free chart tab", () => {
    const tabsSource = readFileSync("src/components/fate-tabs.tsx", "utf8");
    const chartPageSource = readFileSync("src/app/la-so/[id]/page.tsx", "utf8");

    expect(tabsSource).toContain('"nam-2026"');
    expect(tabsSource.indexOf('key: "nam-2026"')).toBeLessThan(tabsSource.indexOf('key: "tai-loc"'));
    expect(chartPageSource).toContain('"nam-2026", "tai-loc"');
    expect(chartPageSource).toContain("<YearlyFortune2026View chartId={id} chart={record.chart} />");
  });
});
