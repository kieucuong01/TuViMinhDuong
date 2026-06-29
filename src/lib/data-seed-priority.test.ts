import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const dbState = vi.hoisted(() => ({
  article: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  getDb: () => ({
    article: dbState.article,
  }),
}));

describe("article seed priority", () => {
  beforeEach(() => {
    dbState.article.findMany.mockReset();
    dbState.article.findUnique.mockReset();
  });

  it("prefers a fresher seed article over an older CMS record for the same slug", async () => {
    dbState.article.findUnique.mockResolvedValue({
      id: "cms-lap-la-so",
      slug: "lap-la-so-tu-vi-chuan",
      title: "Lập lá số tử vi chuẩn: Cần chuẩn bị gì để kết quả sát hơn?",
      excerpt: "Bản CMS cũ hơn seed article.",
      content: "## Nội dung cũ",
      status: "published",
      coverImage: "/articles/lap-la-so-tu-vi-chuan.webp",
      coverAlt: "Minh họa cũ",
      focusKeyword: "lập lá số tử vi chuẩn",
      metaTitle: "Bản CMS cũ",
      metaDescription: "Bản CMS cũ",
      canonicalUrl: "/kien-thuc-tu-vi/lap-la-so-tu-vi-chuan",
      robots: "index,follow",
      ogImage: "/articles/lap-la-so-tu-vi-chuan.webp",
      ogTitle: "Bản CMS cũ",
      ogDescription: "Bản CMS cũ",
      schemaType: "Article",
      faqs: [],
      seoScore: 0,
      seoChecklist: null,
      publishedAt: new Date("2026-06-12T00:00:00+07:00"),
      updatedAt: new Date("2026-06-13T00:00:00+07:00"),
      category: null,
      categoryId: "cat-nhap-mon",
      createdAt: new Date("2026-06-12T00:00:00+07:00"),
    });

    const { getArticleBySlug } = await import("@/lib/data");
    const article = await getArticleBySlug("lap-la-so-tu-vi-chuan");

    expect(article?.publishedAt?.toISOString()).toBe(new Date("2026-06-29T00:00:00+07:00").toISOString());
    expect(article?.content).toContain("## Nếu bạn đang phân vân giữa hai khung giờ sinh sát nhau");
    expect(article?.content).not.toContain("## Nội dung cũ");
  });
});
