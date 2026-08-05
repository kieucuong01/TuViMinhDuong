import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ getDb: () => null }));

describe("public article index payload", () => {
  it("keeps the complete seed index below a 512 KiB cache budget", async () => {
    const { listArticleIndex, listArticles } = await import("@/lib/data/articles");

    const [index, fullArticles] = await Promise.all([listArticleIndex(), listArticles()]);
    const indexBytes = Buffer.byteLength(JSON.stringify(index), "utf8");
    const fullBytes = Buffer.byteLength(JSON.stringify(fullArticles), "utf8");

    expect(index.length).toBe(fullArticles.length);
    expect(indexBytes).toBeLessThan(512 * 1024);
    expect(indexBytes).toBeLessThan(fullBytes * 0.25);
    expect(index.every((article) => !("content" in article) && !("faqs" in article))).toBe(true);
  });
});
