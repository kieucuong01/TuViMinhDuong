import { describe, expect, it } from "vitest";
import {
  MAIN_STARS,
  PALACES,
  buildPseoCombinations,
  buildPseoDraft,
} from "@/lib/pseo-registry";
import { auditPseoInventory, auditPseoPage } from "@/lib/pseo-audit";
import {
  getPseoEntityPage,
  getPublishedPseoPage,
  getRelatedPseoPages,
  listPseoEntities,
  listPublishedPseoSlugs,
} from "@/lib/pseo-data";

describe("pSEO registry", () => {
  it("defines the complete 14 main stars and 12 palaces", () => {
    expect(MAIN_STARS).toHaveLength(14);
    expect(PALACES).toHaveLength(12);
  });

  it("builds 168 unique star-palace combinations", () => {
    const combinations = buildPseoCombinations();
    expect(combinations).toHaveLength(168);
    expect(new Set(combinations.map((page) => page.slug)).size).toBe(168);
    expect(combinations.map((page) => page.slug)).toContain("sao-thai-am-cung-tai-bach");
  });

  it("derives deterministic scores instead of accepting AI-generated numbers", () => {
    const first = buildPseoDraft("thai-am", "tai-bach");
    const second = buildPseoDraft("thai-am", "tai-bach");
    expect(first.scores).toEqual(second.scores);
    expect(Object.values(first.scores).every((score) => score >= 1 && score <= 10)).toBe(true);
  });
});

describe("pSEO audit", () => {
  it("rejects thin, unsafe and disconnected pages", () => {
    const page = {
      ...buildPseoDraft("thai-am", "tai-bach"),
      body: "Chắc chắn giàu có.",
      metaTitle: "",
      metaDescription: "",
    };
    const findings = auditPseoPage(page);
    expect(findings.map((finding) => finding.code)).toEqual(
      expect.arrayContaining(["thin-content", "unsafe-claim", "missing-metadata", "missing-internal-links"]),
    );
  });

  it("accepts the generated inventory and keeps canonical slugs unique", () => {
    const findings = auditPseoInventory(buildPseoCombinations());
    expect(findings.filter((finding) => finding.severity === "error")).toEqual([]);
  });
});

describe("pSEO data access", () => {
  it("serves the published fallback inventory when PostgreSQL is not configured", async () => {
    const slugs = await listPublishedPseoSlugs();
    const page = await getPublishedPseoPage("sao-thai-am-cung-tai-bach");
    expect(slugs).toHaveLength(168);
    expect(page?.starSlug).toBe("thai-am");
    expect((await listPseoEntities("MAIN_STAR"))).toHaveLength(14);
  });

  it("keeps lookup entity URLs separate from the knowledge article archive", async () => {
    const stars = await listPseoEntities("MAIN_STAR");
    const palaces = await listPseoEntities("PALACE");
    expect(stars.every((entity) => entity.canonicalPath?.startsWith("/tra-cuu/sao-"))).toBe(true);
    expect(palaces.every((entity) => entity.canonicalPath?.startsWith("/tra-cuu/cung-"))).toBe(true);
    expect([...stars, ...palaces].some((entity) => entity.canonicalPath?.includes("/kien-thuc-tu-vi"))).toBe(false);
  });

  it("serves standalone lookup entity pages for stars and palaces", async () => {
    const starPage = await getPseoEntityPage("sao-thai-am");
    const palacePage = await getPseoEntityPage("cung-tai-bach");
    expect(starPage?.canonicalUrl).toBe("/tra-cuu/sao-thai-am");
    expect(starPage?.relatedPages).toHaveLength(12);
    expect(palacePage?.canonicalUrl).toBe("/tra-cuu/cung-tai-bach");
    expect(palacePage?.relatedPages).toHaveLength(14);
  });

  it("returns related pages in both internal-link directions", async () => {
    const related = await getRelatedPseoPages("thai-am", "tai-bach");
    expect(related.sameStar.every((page) => page.starSlug === "thai-am")).toBe(true);
    expect(related.samePalace.every((page) => page.palaceSlug === "tai-bach")).toBe(true);
  });
});
