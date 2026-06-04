import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const componentPath = fileURLToPath(new URL("./article-personalized-cta.tsx", import.meta.url));
const ctaSource = existsSync(componentPath) ? readFileSync(componentPath, "utf8") : "";
const articlePageSource = readFileSync(fileURLToPath(new URL("../app/kien-thuc-tu-vi/[slug]/page.tsx", import.meta.url)), "utf8");
const globalsSource = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

describe("ArticlePersonalizedCta", () => {
  it("invites article readers to personalize the topic early", () => {
    expect(ctaSource).toContain("article-personalized-cta");
    expect(ctaSource).toContain("theo lá số của bạn");
    expect(ctaSource).toContain("/#lap-la-so");
    expect(ctaSource).toContain("/xem-ngay");
  });

  it("renders the personalized CTA inside the long-form reading flow", () => {
    expect(articlePageSource).toContain("ArticlePersonalizedCta");
    expect(articlePageSource).toContain("const midArticleCta");
    expect(articlePageSource).toContain("afterFirstSection={midArticleCta}");
  });

  it("keeps article readers moving with table of contents, middle CTA, final CTA, and related articles", () => {
    expect(articlePageSource).toContain("extractMarkdownHeadings");
    expect(articlePageSource).toContain("article-table-of-contents");
    expect(articlePageSource).toContain("afterFirstSection");
    expect(articlePageSource).toContain("article-final-cta");
    expect(articlePageSource).toContain("article-related-grid");
    expect(articlePageSource).toContain("article.category?.id");
  });

  it("has scoped styling so the CTA is visible without hijacking the article", () => {
    expect(globalsSource).toContain(".article-personalized-cta");
    expect(globalsSource).toContain(".article-personalized-actions");
  });

  it("keeps public article pages wide and justified on desktop", () => {
    expect(articlePageSource).toContain("article-shell article-shell-public");
    expect(articlePageSource).not.toContain("article-shell mx-auto max-w-3xl");
    expect(globalsSource).toContain("width: min(100%, 80rem)");
    expect(globalsSource).toContain(".article-shell-public > h1");
    expect(globalsSource).toContain(".article-shell-public .prose-content");
    expect(globalsSource).toContain("width: 100%");
    expect(globalsSource).toContain(".article-shell-public .prose-content p");
    expect(globalsSource).toContain("text-align: justify");
  });
});
