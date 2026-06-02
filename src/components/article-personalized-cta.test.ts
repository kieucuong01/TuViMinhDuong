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

  it("renders before long-form article content", () => {
    expect(articlePageSource).toContain("ArticlePersonalizedCta");
    expect(articlePageSource.indexOf("<ArticlePersonalizedCta")).toBeLessThan(articlePageSource.indexOf("<MarkdownContent"));
  });

  it("has scoped styling so the CTA is visible without hijacking the article", () => {
    expect(globalsSource).toContain(".article-personalized-cta");
    expect(globalsSource).toContain(".article-personalized-actions");
  });
});
