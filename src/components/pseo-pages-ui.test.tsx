import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import LookupHubPage from "@/app/tra-cuu/page";
import { PseoArticleFunnel } from "@/components/pseo-article-funnel";
import { PseoEntityPage } from "@/components/pseo-entity-page";
import { PseoHub } from "@/components/pseo-hub";
import type { PseoEntityPageView } from "@/lib/pseo-data";
import { buildPseoInventory, MAIN_STARS } from "@/lib/pseo-registry";

vi.mock("@/components/chart-form", () => ({
  ChartForm: () => createElement("form", { "data-testid": "chart-form" }),
}));

const publishedPage = buildPseoInventory().find((page) => page.status === "PUBLISHED");

if (!publishedPage) {
  throw new Error("Expected at least one published pSEO fixture.");
}

const entityPage: PseoEntityPageView = {
  kind: "MAIN_STAR",
  entity: MAIN_STARS[0]!,
  routeSlug: `sao-${MAIN_STARS[0]!.slug}`,
  canonicalUrl: `/tra-cuu/sao-${MAIN_STARS[0]!.slug}`,
  title: `Sao ${MAIN_STARS[0]!.name} trong tử vi`,
  description: `Tra cứu ý nghĩa sao ${MAIN_STARS[0]!.name}.`,
  hubHref: "/tra-cuu/y-nghia-14-chinh-tinh",
  hubLabel: "Ý nghĩa 14 Chính Tinh",
  relatedPages: [publishedPage],
};

describe("pSEO page family UI", () => {
  it("gives the root lookup hub its own practical guidance and chart path", () => {
    const html = renderToStaticMarkup(createElement(LookupHubPage));

    expect(html).toContain("Cách dùng thư viện tra cứu");
    expect(html).toContain('href="/#lap-la-so"');
    expect(html).toContain('class="pseo-root-guide"');
  });

  it("renders entity hubs as editorial indexes instead of repeated cards", () => {
    const html = renderToStaticMarkup(
      createElement(PseoHub, {
        title: "Ý nghĩa 14 Chính Tinh",
        description: "Tra cứu chính tinh theo đúng bối cảnh.",
        entities: MAIN_STARS.slice(0, 3),
      }),
    );

    expect(html).toContain('class="pseo-hub-index"');
    expect(html).toContain('class="pseo-hub-index-number"');
    expect(html).not.toContain("pseo-hub-grid");
  });

  it("keeps entity reading context but omits an empty related section", () => {
    const html = renderToStaticMarkup(createElement(PseoEntityPage, { page: entityPage }));
    const withoutRelatedHtml = renderToStaticMarkup(
      createElement(PseoEntityPage, { page: { ...entityPage, relatedPages: [] } }),
    );

    expect(html).toContain('class="pseo-entity-reading-note"');
    expect(html).toContain("pseo-related-group");
    expect(withoutRelatedHtml).not.toContain("pseo-related-group");
  });

  it("uses a data strip and omits empty related article groups", () => {
    const withRelatedHtml = renderToStaticMarkup(
      createElement(PseoArticleFunnel, {
        page: publishedPage,
        sameStar: [publishedPage],
        samePalace: [],
      }),
    );
    const withoutRelatedHtml = renderToStaticMarkup(
      createElement(PseoArticleFunnel, {
        page: publishedPage,
        sameStar: [],
        samePalace: [],
      }),
    );

    expect(withRelatedHtml).toContain('class="pseo-data-strip"');
    expect(withRelatedHtml).toContain("Cùng sao, khác cung");
    expect(withRelatedHtml).not.toContain("Cùng cung, khác sao");
    expect(withoutRelatedHtml).not.toContain("pseo-related-group");
    expect(withoutRelatedHtml).not.toContain('class="pseo-related"');
  });

  it("defines editorial tokens and narrow-screen overflow safeguards", () => {
    const css = readFileSync("src/app/globals.css", "utf8");

    expect(css).toContain("--pseo-ink:");
    expect(css).toContain("content-visibility: auto");
    expect(css).toMatch(/@media \(max-width: 720px\)[\s\S]*min-width:\s*0/);
  });
});
