import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

const fateTabsSource = readFileSync(fileURLToPath(new URL("./fate-tabs.tsx", import.meta.url)), "utf8");
const chartPageSource = readFileSync(fileURLToPath(new URL("../app/la-so/[id]/page.tsx", import.meta.url)), "utf8");
const advancedReadingPageSource = readFileSync(
  fileURLToPath(new URL("../app/la-so/[id]/nang-cao/page.tsx", import.meta.url)),
  "utf8",
);

describe("fate tabs", () => {
  it("keeps Nhat van as the final fate tab and removes Chuyen de", () => {
    expect(fateTabsSource).toContain('label: "Nhật vận"');
    expect(fateTabsSource).not.toContain("Chuyên đề");
    expect(fateTabsSource).not.toContain("chuyen-de");
    expect(chartPageSource).not.toContain("chuyen-de");
  });

  it("only exposes chart-specific fate views to the chart owner or an admin", () => {
    expect(chartPageSource).toContain("const canUsePaidFateViews = paidFeaturesVisible && canReadFullOverview;");
    expect(chartPageSource).toContain("const visibleViews: FateView[] = canUsePaidFateViews");
    expect(chartPageSource).toContain('<FateTabs chartId={id} active={activeView} visibleViews={visibleViews} />');
  });

  it("keeps the wealth report visible without granting access to paid fate views", () => {
    expect(fateTabsSource).toContain('"tai-loc"');
    expect(fateTabsSource).toContain('label: "Tài lộc"');
    expect(fateTabsSource).toContain("visibleViews.includes(tab.key)");
    expect(chartPageSource).toContain('["la-so", "tai-loc"]');
    expect(chartPageSource).toContain('activeView === "tai-loc"');
  });

  it("exposes the active fate tab as the current page", async () => {
    const { FateTabs } = await import("./fate-tabs");

    const html = renderToStaticMarkup(createElement(FateTabs, {
      chartId: "chart-1",
      active: "tai-loc",
      visibleViews: ["la-so", "tai-loc"],
    }));

    expect((html.match(/aria-current="page"/g) ?? [])).toHaveLength(1);
    expect(html).toMatch(/<a(?=[^>]*href="\/la-so\/chart-1\?view=tai-loc")(?=[^>]*aria-current="page")[^>]*>Tài lộc<\/a>/);
  });

  it("binds a requested advanced reading to the chart in the current route", () => {
    expect(advancedReadingPageSource).toContain(
      "const requestedReading = requestedReadingCandidate?.chartId === id ? requestedReadingCandidate : null;",
    );
  });
});
