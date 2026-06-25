import { describe, expect, it } from "vitest";
import { MAIN_STARS } from "@/lib/pseo-registry";
import { buildPseoSitemapIndexXml, buildPseoSitemapXml } from "@/lib/pseo-sitemap";

describe("pSEO sitemaps", () => {
  it("builds a sitemap index with one sitemap per main star", () => {
    const xml = buildPseoSitemapIndexXml("https://lasotinhhoa.vn");
    expect((xml.match(/<sitemap>/g) || [])).toHaveLength(15);
    expect(xml).toContain("/tra-cuu/sitemap/thai-am");
    expect(xml).toContain("/sitemap.xml");
  });

  it("keeps every star sitemap unique and scoped to that star", () => {
    const pages = MAIN_STARS.flatMap((star) => [
      {
        slug: `sao-${star.slug}-cung-menh`,
        starSlug: star.slug,
        updatedAt: new Date("2026-06-25T00:00:00+07:00"),
      },
    ]);
    const xml = buildPseoSitemapXml("https://lasotinhhoa.vn", "thai-am", pages);
    expect(xml).toContain("/tra-cuu/sao-thai-am-cung-menh");
    expect(xml).not.toContain("/tra-cuu/sao-tu-vi-cung-menh");
  });
});
