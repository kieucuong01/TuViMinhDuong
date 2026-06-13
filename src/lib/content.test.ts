import { describe, expect, it } from "vitest";
import { articleWithScore, seedArticles } from "@/lib/content";

describe("SEO content cluster", () => {
  it("contains the beginner hub and palace support articles", () => {
    const slugs = new Set(seedArticles.map((article) => article.slug));

    expect(slugs).toContain("la-so-tu-vi-la-gi");
    expect(slugs).toContain("cach-doc-la-so-tu-vi-cho-nguoi-moi");
    expect(slugs).toContain("cung-phu-the-trong-tu-vi");
    expect(slugs).toContain("cung-phuc-duc-trong-tu-vi");
    expect(slugs).toContain("cung-dien-trach-trong-tu-vi");
    expect(slugs).toContain("cung-tu-tuc-trong-tu-vi");
    expect(slugs).toContain("cung-no-boc-trong-tu-vi");
    expect(slugs).toContain("cung-tat-ach-trong-tu-vi");
    expect(slugs).toContain("cung-thien-di-trong-tu-vi");
    expect(slugs).toContain("lap-la-so-tu-vi-chuan");
  });

  it("links the beginner cluster back to conversion and related evergreen pages", () => {
    const hub = seedArticles.find((article) => article.slug === "la-so-tu-vi-la-gi");
    const guide = seedArticles.find((article) => article.slug === "cach-doc-la-so-tu-vi-cho-nguoi-moi");
    const preciseSetup = seedArticles.find((article) => article.slug === "lap-la-so-tu-vi-chuan");

    expect(hub?.content).toContain("/#lap-la-so");
    expect(hub?.content).toContain("/kien-thuc-tu-vi/cung-menh-cung-than");
    expect(hub?.content).toContain("/kien-thuc-tu-vi/12-cung-trong-la-so-tu-vi");
    expect(guide?.content).toContain("/kien-thuc-tu-vi/cung-phu-the-trong-tu-vi");
    expect(guide?.content).toContain("/kien-thuc-tu-vi/cung-tat-ach-trong-tu-vi");
    expect(guide?.content).toContain("/kien-thuc-tu-vi/cung-thien-di-trong-tu-vi");
    expect(preciseSetup?.content).toContain("/#lap-la-so");
    expect(preciseSetup?.content).toContain("/kien-thuc-tu-vi/tao-la-so-tu-vi");
    expect(preciseSetup?.content).toContain("/kien-thuc-tu-vi/gio-sinh-trong-tu-vi");
  });

  it("uses dedicated SEO images for every public knowledge article", () => {
    const coverImages = new Set<string>();

    for (const article of seedArticles) {
      expect(article.coverImage, `${article.slug} should have a local thumbnail`).toMatch(/^\/articles\/.+\.(svg|png|webp)$/);
      expect(article.ogImage, `${article.slug} should use the same image for social sharing`).toBe(article.coverImage);
      expect(article.coverAlt, `${article.slug} should have descriptive alt text`).toMatch(/^Minh họa .{24,}$/);
      expect(article.coverAlt, `${article.slug} alt should not contain mojibake`).not.toMatch(/Ã|Â|á»|Ä|Æ|�|\?/);
      expect(article.content, `${article.slug} should include the cover as an in-article illustration`).toContain(
        `![${article.coverAlt}](${article.coverImage})`,
      );
      coverImages.add(article.coverImage || "");
    }

    expect(coverImages.size).toBe(seedArticles.length);
  });

  it("uses a dedicated raster SEO cover for the precise chart setup article", () => {
    const preciseSetup = seedArticles.find((article) => article.slug === "lap-la-so-tu-vi-chuan");

    expect(preciseSetup?.coverImage).toBe("/articles/lap-la-so-tu-vi-chuan.webp");
    expect(preciseSetup?.ogImage).toBe("/articles/lap-la-so-tu-vi-chuan.webp");
    expect(preciseSetup?.coverAlt).toContain("lập lá số tử vi chuẩn");
    expect(preciseSetup?.coverAlt).toContain("ngày giờ sinh");
    expect(preciseSetup?.coverAlt).toContain("bàn lá số 12 cung");
  });

  it("does not expose SEO implementation notes in public article copy", () => {
    for (const article of seedArticles) {
      expect(article.content).not.toContain("Nguồn tham khảo và kỹ thuật SEO");
      expect(article.content).not.toContain("Website dùng canonical URL");
      expect(article.content).not.toContain("qualify outbound links");
    }
  });

  it("keeps new evergreen articles above the minimum SEO score", () => {
    const newCluster = seedArticles
      .filter((article) =>
        [
          "la-so-tu-vi-la-gi",
          "cach-doc-la-so-tu-vi-cho-nguoi-moi",
          "cung-phu-the-trong-tu-vi",
          "cung-phuc-duc-trong-tu-vi",
          "cung-dien-trach-trong-tu-vi",
          "cung-tu-tuc-trong-tu-vi",
          "cung-no-boc-trong-tu-vi",
          "cung-tat-ach-trong-tu-vi",
          "cung-thien-di-trong-tu-vi",
          "lap-la-so-tu-vi-chuan",
        ].includes(article.slug),
      )
      .map(articleWithScore);

    for (const article of newCluster) {
      expect(article.seoScore).toBeGreaterThanOrEqual(70);
    }
  });

  it("keeps public knowledge articles above thin-content thresholds", () => {
    for (const article of seedArticles) {
      const plainText = article.content
        .replace(/\[[^\]]+]\([^)]+\)/g, " ")
        .replace(/[#>*`|\-]+/g, " ");
      const wordCount = plainText.match(/[\wÀ-ỹ]+/gu)?.length ?? 0;
      const internalLinks = article.content.match(/]\(\/[^)]+\)/g)?.length ?? 0;
      const h2Count = article.content.match(/^##\s+/gm)?.length ?? 0;

      expect(article.content.length, `${article.slug} should not be thin`).toBeGreaterThanOrEqual(4500);
      expect(wordCount, `${article.slug} should have enough editorial depth`).toBeGreaterThanOrEqual(800);
      expect(internalLinks, `${article.slug} should have contextual internal links`).toBeGreaterThanOrEqual(5);
      expect(h2Count, `${article.slug} should have a scannable H2 structure`).toBeGreaterThanOrEqual(5);
    }
  });

  it("refreshes the core pillars with depth, trust framing, and contextual anchors", () => {
    const corePillars = [
      "la-so-tu-vi-la-gi",
      "12-cung-trong-la-so-tu-vi",
      "cung-menh-cung-than",
    ].map((slug) => seedArticles.find((article) => article.slug === slug));

    for (const article of corePillars) {
      expect(article, "pillar article should exist").toBeTruthy();
      expect(article!.content.length, `${article!.slug} should not be a thin pillar`).toBeGreaterThanOrEqual(5000);
      expect(article!.content, `${article!.slug} should explain editorial trust`).toContain("Cách Lá số tinh hoa biên tập");
      expect(article!.content, `${article!.slug} should keep reader-first caveats`).toContain("không thay thế");
      expect(article!.content, `${article!.slug} should include the conversion path`).toContain("[lập lá số tử vi miễn phí](/#lap-la-so)");
      expect(article!.faqs?.length ?? 0, `${article!.slug} should have visible FAQ support`).toBeGreaterThanOrEqual(3);
    }

    expect(corePillars[0]!.content).toContain("[Cung Mệnh và Cung Thân là hai trục đọc đầu tiên](/kien-thuc-tu-vi/cung-menh-cung-than)");
    expect(corePillars[1]!.content).toContain("[Cung Quan Lộc khi đang hỏi về công việc](/kien-thuc-tu-vi/cung-quan-loc-trong-tu-vi)");
    expect(corePillars[2]!.content).toContain("[12 cung trong lá số tử vi để đặt Mệnh - Thân vào bức tranh đầy đủ](/kien-thuc-tu-vi/12-cung-trong-la-so-tu-vi)");
  });
});
