import { describe, expect, it } from "vitest";
import {
  MAIN_STARS,
  PALACES,
  CURATED_PSEO_SLUGS,
  MANUAL_PSEO_BATCH_3_SLUGS,
  MANUAL_PSEO_BATCH_4_SLUGS,
  MANUAL_PSEO_BATCH_5_SLUGS,
  MANUAL_PSEO_BATCH_6_SLUGS,
  MANUAL_PSEO_BATCH_7_SLUGS,
  MANUAL_PSEO_BATCH_8_SLUGS,
  MANUAL_PSEO_BATCH_9_SLUGS,
  MANUAL_PSEO_BATCH_10_SLUGS,
  MANUAL_PSEO_BATCH_11_SLUGS,
  MANUAL_PSEO_BATCH_12_SLUGS,
  buildPseoCombinations,
  buildPseoDraft,
  buildPseoInventory,
} from "@/lib/pseo-registry";
import { auditPseoInventory, auditPseoPage, contentSimilarityScore } from "@/lib/pseo-audit";
import { getPseoEntityContent } from "@/lib/pseo-entity-content";
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

  it("publishes only the hand-written SEO batches and leaves the remaining matrix as drafts", () => {
    const inventory = buildPseoInventory();
    const published = inventory.filter((page) => page.status === "PUBLISHED");
    const drafts = inventory.filter((page) => page.status === "DRAFT");
    expect(inventory).toHaveLength(168);
    expect(published.map((page) => page.slug).sort()).toEqual([...CURATED_PSEO_SLUGS].sort());
    expect(published).toHaveLength(168);
    expect(drafts).toHaveLength(0);
    expect(MANUAL_PSEO_BATCH_3_SLUGS).toHaveLength(36);
    expect(MANUAL_PSEO_BATCH_4_SLUGS).toHaveLength(5);
    expect(MANUAL_PSEO_BATCH_5_SLUGS).toHaveLength(12);
    expect(MANUAL_PSEO_BATCH_6_SLUGS).toHaveLength(12);
    expect(MANUAL_PSEO_BATCH_7_SLUGS).toHaveLength(12);
    expect(MANUAL_PSEO_BATCH_8_SLUGS).toHaveLength(6);
    expect(MANUAL_PSEO_BATCH_9_SLUGS).toHaveLength(12);
    expect(MANUAL_PSEO_BATCH_10_SLUGS).toHaveLength(12);
    expect(MANUAL_PSEO_BATCH_11_SLUGS).toHaveLength(12);
    expect(MANUAL_PSEO_BATCH_12_SLUGS).toHaveLength(7);
    expect(drafts.every((page) => page.robots === "noindex,follow")).toBe(true);
  });

  it("derives deterministic scores instead of accepting AI-generated numbers", () => {
    const first = buildPseoDraft("thai-am", "tai-bach");
    const second = buildPseoDraft("thai-am", "tai-bach");
    expect(first.scores).toEqual(second.scores);
    expect(Object.values(first.scores).every((score) => score >= 1 && score <= 10)).toBe(true);
  });

  it("gives every standalone star and palace page substantial entity-specific guidance", () => {
    const entities = [...MAIN_STARS, ...PALACES];
    const intents = new Set<string>();

    for (const entity of entities) {
      const content = getPseoEntityContent(entity.kind as "MAIN_STAR" | "PALACE", entity);
      const text = [
        content.intent,
        ...content.intro,
        ...content.contextRows.flatMap((row) => [row.label, row.value, row.howToRead]),
        ...content.usefulSignals.flatMap((item) => [item.title, item.body]),
        ...content.misreadRisks.flatMap((item) => [item.title, item.body]),
        ...content.practiceSteps,
        ...content.modifierNotes,
        ...content.faqs.flatMap((item) => [item.question, item.answer]),
      ].join(" ");

      intents.add(content.intent);
      expect(content.intro).toHaveLength(3);
      expect(content.usefulSignals).toHaveLength(3);
      expect(content.misreadRisks).toHaveLength(3);
      expect(content.practiceSteps).toHaveLength(3);
      expect(content.modifierNotes).toHaveLength(2);
      expect(content.faqs).toHaveLength(2);
      expect(text.length).toBeGreaterThan(1900);
      expect(text).toContain(entity.name);
      expect(text).toContain("lá số");
    }

    expect(intents.size).toBe(entities.length);
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

  it("accepts only hand-written published pages and keeps canonical slugs unique", () => {
    const findings = auditPseoInventory(buildPseoInventory());
    expect(findings.filter((finding) => finding.severity === "error")).toEqual([]);
  }, 240_000);

  it("keeps published lookup body similarity below the dedupe risk guard", () => {
    const pages = buildPseoInventory().filter((page) => page.status === "PUBLISHED");
    let maxSimilarity = 0;
    for (let firstIndex = 0; firstIndex < pages.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < pages.length; secondIndex += 1) {
        maxSimilarity = Math.max(maxSimilarity, contentSimilarityScore(pages[firstIndex].body, pages[secondIndex].body));
      }
    }
    expect(maxSimilarity).toBeLessThan(0.64);
  }, 240_000);

  it("flags pages that are too similar to another published lookup page", () => {
    const [first, second] = buildPseoInventory().filter((page) => page.status === "PUBLISHED");
    const findings = auditPseoInventory([{ ...first }, { ...second, body: first.body }]);
    expect(contentSimilarityScore(first.body, first.body)).toBe(1);
    expect(findings.map((finding) => finding.code)).toContain("duplicate-template");
  });

  it("flags repeated SERP metadata formulas across lookup pages", () => {
    const [first, second] = buildPseoInventory().filter((page) => page.status === "PUBLISHED");
    const findings = auditPseoInventory([
      {
        ...first,
        metaTitle: "Tử Vi cung Mệnh: ý nghĩa và cách đọc",
        metaDescription: "Tra cứu Tử Vi tại cung Mệnh: điểm thuận lợi, điều cần thận trọng và cách đối chiếu đúng với lá số cá nhân.",
      },
      {
        ...second,
        metaTitle: "Thiên Cơ cung Quan Lộc: ý nghĩa và cách đọc",
        metaDescription: "Tra cứu Thiên Cơ tại cung Quan Lộc: điểm thuận lợi, điều cần thận trọng và cách đối chiếu đúng với lá số cá nhân.",
      },
    ]);
    expect(findings.map((finding) => finding.code)).toContain("repeated-serp-pattern");
  });

  it("rejects proper Vietnamese absolute claims and article-shape artifacts", () => {
    const source = buildPseoInventory().find((page) => page.status === "PUBLISHED")!;
    const findings = auditPseoPage({
      ...source,
      body: `# Tiêu đề lặp trong thân bài\n\n${source.body.replaceAll("](/#lap-la-so)", "](/lap-la-so)")}\n\nMột người bạn của tôi có cách cục này, nên dành 40% thu nhập để đầu tư. Chắc chắn giàu có.`,
    });
    expect(findings.map((finding) => finding.code)).toEqual(
      expect.arrayContaining(["unsafe-claim", "invalid-content-shape", "fabricated-anecdote", "over-specific-advice", "missing-internal-links"]),
    );
  });

  it("does not link published pages to draft leaf pages", () => {
    const inventory = buildPseoInventory();
    const publishedLeafPaths = new Set(
      inventory.filter((page) => page.status === "PUBLISHED").map((page) => `/tra-cuu/${page.slug}`),
    );
    const leafLinkPattern = /\]\((\/tra-cuu\/sao-[^)]+-cung-[^)]+)\)/g;
    for (const page of inventory.filter((item) => item.status === "PUBLISHED")) {
      const linkedLeafPaths = [...page.body.matchAll(leafLinkPattern)].map((match) => match[1]);
      expect(linkedLeafPaths.filter((path) => !publishedLeafPaths.has(path))).toEqual([]);
    }
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
    const supportStars = await listPseoEntities("SUPPORT_STAR");
    expect(stars.every((entity) => entity.canonicalPath?.startsWith("/tra-cuu/sao-"))).toBe(true);
    expect(palaces.every((entity) => entity.canonicalPath?.startsWith("/tra-cuu/cung-"))).toBe(true);
    expect(supportStars.every((entity) => entity.canonicalPath?.startsWith("/tra-cuu/phu-tinh/"))).toBe(true);
    expect([...stars, ...palaces, ...supportStars].some((entity) => entity.canonicalPath?.includes("/kien-thuc-tu-vi"))).toBe(false);
  });

  it("serves standalone lookup entity pages for stars and palaces", async () => {
    const starPage = await getPseoEntityPage("sao-thai-am");
    const palacePage = await getPseoEntityPage("cung-tai-bach");
    expect(starPage?.canonicalUrl).toBe("/tra-cuu/sao-thai-am");
    expect(starPage?.relatedPages.length).toBeGreaterThan(0);
    expect(palacePage?.canonicalUrl).toBe("/tra-cuu/cung-tai-bach");
    expect(palacePage?.relatedPages.length).toBeGreaterThan(0);
  });

  it("returns related pages in both internal-link directions", async () => {
    const related = await getRelatedPseoPages("thai-am", "tai-bach");
    expect(related.sameStar.every((page) => page.starSlug === "thai-am")).toBe(true);
    expect(related.samePalace.every((page) => page.palaceSlug === "tai-bach")).toBe(true);
  });
});
