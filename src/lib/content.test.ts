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
    expect(slugs).toContain("cung-tat-ach-trong-tu-vi");
    expect(slugs).toContain("cung-thien-di-trong-tu-vi");
  });

  it("links the beginner cluster back to conversion and related evergreen pages", () => {
    const hub = seedArticles.find((article) => article.slug === "la-so-tu-vi-la-gi");
    const guide = seedArticles.find((article) => article.slug === "cach-doc-la-so-tu-vi-cho-nguoi-moi");

    expect(hub?.content).toContain("/#lap-la-so");
    expect(hub?.content).toContain("/kien-thuc-tu-vi/cung-menh-cung-than");
    expect(hub?.content).toContain("/kien-thuc-tu-vi/12-cung-trong-la-so-tu-vi");
    expect(guide?.content).toContain("/kien-thuc-tu-vi/cung-phu-the-trong-tu-vi");
    expect(guide?.content).toContain("/kien-thuc-tu-vi/cung-tat-ach-trong-tu-vi");
    expect(guide?.content).toContain("/kien-thuc-tu-vi/cung-thien-di-trong-tu-vi");
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
          "cung-tat-ach-trong-tu-vi",
          "cung-thien-di-trong-tu-vi",
        ].includes(article.slug),
      )
      .map(articleWithScore);

    for (const article of newCluster) {
      expect(article.seoScore).toBeGreaterThanOrEqual(70);
    }
  });
});
