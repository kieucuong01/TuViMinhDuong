import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dataSource = readFileSync(fileURLToPath(new URL("./data.ts", import.meta.url)), "utf8");
const actionsSource = readFileSync(fileURLToPath(new URL("../app/actions.ts", import.meta.url)), "utf8");

describe("public article data cache", () => {
  it("caches public article readers under a shared tag", () => {
    expect(dataSource).toContain('export const ARTICLES_CACHE_TAG = "articles"');
    expect(dataSource).toContain("getCachedArticlesFromDb = cacheServerData");
    expect(dataSource).toContain("getCachedArticleBySlugFromDb = cacheServerData");
    expect(dataSource).toContain("getCachedArticleCategoriesFromDb = cacheServerData");
  });

  it("revalidates public article cache after CMS mutations", () => {
    expect(actionsSource).toContain("ARTICLES_CACHE_TAG");
    expect(actionsSource.match(/revalidateTag\(ARTICLES_CACHE_TAG, "max"\)/g)?.length).toBeGreaterThanOrEqual(3);
  });
});
