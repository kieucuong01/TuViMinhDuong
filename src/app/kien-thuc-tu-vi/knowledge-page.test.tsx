import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listArticleIndex: vi.fn(),
  listArticleCategories: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/data", () => ({
  listArticleIndex: mocks.listArticleIndex,
  listArticleCategories: mocks.listArticleCategories,
}));

import KnowledgePage from "./page";

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

describe("knowledge hub answer block", () => {
  beforeEach(() => {
    mocks.listArticleIndex.mockReset().mockResolvedValue([]);
    mocks.listArticleCategories.mockReset().mockResolvedValue([]);
  });

  it("renders a concise, visible answer immediately after the H1", async () => {
    const page = await KnowledgePage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(page);
    const match = html.match(
      /<h1>Bài viết dễ đọc cho người mới bắt đầu<\/h1>\s*<p[^>]*data-answer-block="true"[^>]*>([^<]+)<\/p>/,
    );

    expect(match, "The knowledge H1 must be followed by an extractable answer block").not.toBeNull();
    expect(wordCount(match?.[1] || "")).toBeGreaterThanOrEqual(40);
    expect(wordCount(match?.[1] || "")).toBeLessThanOrEqual(60);
    expect(match?.[1]).toContain("tham khảo");
  });
});
