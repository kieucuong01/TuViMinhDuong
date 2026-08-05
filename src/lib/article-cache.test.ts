import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dataSource = readFileSync(fileURLToPath(new URL("./data/articles.ts", import.meta.url)), "utf8");
const facadeSource = readFileSync(fileURLToPath(new URL("./data.ts", import.meta.url)), "utf8");
const actionsSource = readFileSync(fileURLToPath(new URL("../app/actions.ts", import.meta.url)), "utf8");
const publicListConsumerSources = [
  "../app/[slug]/page.tsx",
  "../app/xem-tu-vi-tron-doi/[slug]/page.tsx",
  "../app/kien-thuc-tu-vi/[slug]/page.tsx",
  "../app/kien-thuc-tu-vi/page.tsx",
  "../app/api/knowledge-articles/route.ts",
  "../app/sitemap.ts",
].map((relativePath) => ({
  relativePath,
  source: readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8"),
}));

describe("public article data cache", () => {
  it("caches public article readers under a shared tag", () => {
    expect(dataSource).toContain('export const ARTICLES_CACHE_TAG = "articles"');
    expect(dataSource).toContain("getCachedArticleIndexFromDb = cacheServerData");
    expect(dataSource).not.toContain("getCachedArticlesFromDb = cacheServerData");
    expect(dataSource).toContain("getCachedArticleBySlugFromDb = cacheServerData");
    expect(dataSource).toContain("getCachedArticleCategoriesFromDb = cacheServerData");
    expect(facadeSource).toContain('from "@/lib/data/articles"');
  });

  it("revalidates public article cache after CMS mutations", () => {
    expect(actionsSource).toContain("ARTICLES_CACHE_TAG");
    expect(actionsSource.match(/revalidateTag\(ARTICLES_CACHE_TAG, "max"\)/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("keeps every public list consumer on the lightweight article index", () => {
    for (const consumer of publicListConsumerSources) {
      expect(consumer.source, consumer.relativePath).toContain("listArticleIndex");
      expect(consumer.source, consumer.relativePath).not.toMatch(/\blistArticles\b/);
    }
  });
});
