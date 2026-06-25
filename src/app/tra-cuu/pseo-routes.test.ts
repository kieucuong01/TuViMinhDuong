import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("pSEO route structure", () => {
  it("keeps the leaf route static-capable and excludes unpublished pages", () => {
    const source = readFileSync("src/app/tra-cuu/[slug]/page.tsx", "utf8");
    expect(source).toContain("generateStaticParams");
    expect(source).toContain("generateMetadata");
    expect(source).toContain("getPublishedPseoPage");
    expect(source).toContain("dynamicParams = true");
  });

  it("renders the conversion funnel and both related-link directions", () => {
    const source = readFileSync("src/app/tra-cuu/[slug]/page.tsx", "utf8");
    expect(source).toContain("PseoArticleFunnel");
    const funnel = readFileSync("src/components/pseo-article-funnel.tsx", "utf8");
    expect(funnel).toContain("ChartForm");
    expect(funnel).toContain("sameStar");
    expect(funnel).toContain("samePalace");
    expect(funnel).toContain('adSource="pseo_inline"');
  });
});
