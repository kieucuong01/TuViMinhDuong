import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const seedState = vi.hoisted(() => {
  const article = (slug: string, title: string, updatedAt: string) => ({
    id: `seed-${slug}`,
    slug,
    title,
    excerpt: `${title} excerpt`,
    content: `${title} full content`,
    status: "published",
    coverImage: `/${slug}.webp`,
    coverAlt: `${title} cover`,
    faqs: [{ question: `${title}?`, answer: title }],
    seoChecklist: [{ label: title }],
    publishedAt: new Date(updatedAt),
    updatedAt: new Date(updatedAt),
  });

  return {
    articles: [
      article("seed-newest", "Newest seed", "2030-01-03T00:00:00.000Z"),
      article("seed-middle", "Middle seed", "2030-01-02T00:00:00.000Z"),
      article("seed-oldest", "Oldest seed", "2030-01-01T00:00:00.000Z"),
    ],
  };
});

vi.mock("@/lib/content", () => ({
  articleWithScore: <T>(article: T) => article,
  seedArticles: seedState.articles,
}));

const dbState = vi.hoisted(() => ({
  enabled: true,
  findMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  getDb: () => dbState.enabled ? { article: { findMany: dbState.findMany } } : null,
}));

type SummaryRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  coverAlt: string;
  status: string;
  publishedAt: Date;
  updatedAt: Date;
  createdAt: Date;
};

function dbArticle(slug: string, updatedAt: string, status = "published"): SummaryRow {
  const date = new Date(updatedAt);
  return {
    id: `db-${slug}`,
    slug,
    title: `DB ${slug}`,
    excerpt: `DB ${slug} excerpt`,
    coverImage: `/${slug}.webp`,
    coverAlt: `DB ${slug} cover`,
    status,
    publishedAt: date,
    updatedAt: date,
    createdAt: date,
  };
}

async function listArticleSummaries(limit?: number) {
  const articleData = await import("@/lib/data/articles") as typeof import("@/lib/data/articles") & {
    listArticleSummaries: (requestedLimit?: number) => Promise<SummaryRow[]>;
  };
  return articleData.listArticleSummaries(limit);
}

describe("public article summaries", () => {
  beforeEach(() => {
    dbState.enabled = true;
    dbState.findMany.mockReset();
    delete (globalThis as { demoArticles?: unknown }).demoArticles;
  });

  it("defaults to three summaries in stable newest-first order", async () => {
    dbState.findMany.mockResolvedValue([
      dbArticle("db-fourth", "2031-01-01T00:00:00.000Z"),
      dbArticle("db-second", "2031-01-03T00:00:00.000Z"),
      dbArticle("db-first", "2031-01-04T00:00:00.000Z"),
      dbArticle("db-third", "2031-01-02T00:00:00.000Z"),
    ]);

    const summaries = await listArticleSummaries();

    expect(summaries.map((article) => article.slug)).toEqual(["db-first", "db-second", "db-third"]);
  });

  it("prefers a fresher seed and suppresses deleted seed tombstones before limiting", async () => {
    dbState.findMany.mockResolvedValue([
      dbArticle("seed-newest", "2029-12-01T00:00:00.000Z"),
      dbArticle("seed-middle", "2031-02-01T00:00:00.000Z", "deleted"),
      dbArticle("db-new", "2031-03-01T00:00:00.000Z"),
    ]);

    const summaries = await listArticleSummaries(3);

    expect(summaries.map((article) => article.slug)).toEqual(["db-new", "seed-newest", "seed-oldest"]);
    expect(summaries.find((article) => article.slug === "seed-newest")?.title).toBe("Newest seed");
    expect(summaries.some((article) => article.slug === "seed-middle")).toBe(false);
  });

  it("uses only card and reconciliation fields in the Prisma query", async () => {
    dbState.findMany.mockResolvedValue([]);

    await listArticleSummaries(3);

    const query = dbState.findMany.mock.calls[0]?.[0] as { select?: Record<string, boolean> };
    expect(query.select).toEqual({
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      coverAlt: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      createdAt: true,
    });
    expect(query.select).not.toHaveProperty("content");
    expect(query.select).not.toHaveProperty("faqs");
    expect(query.select).not.toHaveProperty("seoChecklist");
  });

  it("falls back to demo summaries without a database", async () => {
    dbState.enabled = false;

    const summaries = await listArticleSummaries();

    expect(summaries.map((article) => article.slug)).toEqual(["seed-newest", "seed-middle", "seed-oldest"]);
    expect(dbState.findMany).not.toHaveBeenCalled();
  });

  it.each([0, 1.5, 21])("rejects invalid internal limit %s", async (limit) => {
    await expect(listArticleSummaries(limit)).rejects.toThrow("Article summary limit must be an integer between 1 and 20.");
    expect(dbState.findMany).not.toHaveBeenCalled();
  });

  it("makes the homepage request exactly three summaries", () => {
    const homeSource = readFileSync(fileURLToPath(new URL("../app/page.tsx", import.meta.url)), "utf8");

    expect(homeSource).toContain("listArticleSummaries(3)");
    expect(homeSource).not.toMatch(/listArticles\(\)\.slice\(0,\s*3\)/);
    expect(homeSource).not.toMatch(/listArticles\(\)/);
  });
});
