import { describe, expect, it } from "vitest";
import { paginateArticles } from "@/lib/article-pagination";

const articles = Array.from({ length: 14 }, (_, index) => ({
  slug: `article-${index + 1}`,
  category: { slug: index % 2 === 0 ? "co-ban" : "ung-dung" },
}));

describe("paginateArticles", () => {
  it("returns six articles for a requested desktop page", () => {
    const result = paginateArticles(articles, { page: "2", pageSize: 6 });

    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);
    expect(result.items.map((article) => article.slug)).toEqual([
      "article-7",
      "article-8",
      "article-9",
      "article-10",
      "article-11",
      "article-12",
    ]);
  });

  it("normalizes invalid and out-of-range pages", () => {
    expect(paginateArticles(articles, { page: "-5", pageSize: 6 }).page).toBe(1);
    expect(paginateArticles(articles, { page: "99", pageSize: 6 }).page).toBe(3);
    expect(paginateArticles(articles, { page: "abc", pageSize: 6 }).page).toBe(1);
  });

  it("filters by category before calculating pages", () => {
    const result = paginateArticles(articles, { category: "co-ban", page: "2", pageSize: 6 });

    expect(result.totalItems).toBe(7);
    expect(result.totalPages).toBe(2);
    expect(result.items.map((article) => article.slug)).toEqual(["article-13"]);
  });
});
