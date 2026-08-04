import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listArticles: vi.fn(),
}));

vi.mock("@/lib/env", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/env")>()),
  APP_URL: "https://lasotinhhoa.vn",
}));

vi.mock("@/lib/data", () => ({
  listArticles: mocks.listArticles,
}));

import sitemap from "./sitemap";

function entryFor(entries: Awaited<ReturnType<typeof sitemap>>, path: string) {
  const url = path === "/" ? "https://lasotinhhoa.vn" : `https://lasotinhhoa.vn${path}`;
  const entry = entries.find((item) => item.url === url);
  expect(entry, `Missing sitemap entry for ${path}`).toBeDefined();
  return entry!;
}

describe("sitemap freshness", () => {
  beforeEach(() => {
    mocks.listArticles.mockReset();
    mocks.listArticles.mockResolvedValue([
      {
        slug: "bai-viet-test",
        canonicalUrl: "/kien-thuc-tu-vi/bai-viet-test",
        robots: "index,follow",
        publishedAt: new Date("2026-07-01T00:00:00+07:00"),
        updatedAt: new Date("2026-07-20T00:00:00+07:00"),
      },
    ]);
  });

  it("publishes stable route-specific dates instead of one stale date for every public surface", async () => {
    const entries = await sitemap();

    expect(entryFor(entries, "/").lastModified).toEqual(new Date("2026-07-16T00:00:00+07:00"));
    expect(entryFor(entries, "/kien-thuc-tu-vi").lastModified).toEqual(
      new Date("2026-07-30T00:00:00+07:00"),
    );
    expect(entryFor(entries, "/xem-ngay").lastModified).toEqual(new Date("2026-07-28T00:00:00+07:00"));
    expect(entryFor(entries, "/xem-tuoi").lastModified).toEqual(new Date("2026-07-28T00:00:00+07:00"));
    expect(entryFor(entries, "/tuong-hop-la-so").lastModified).toEqual(new Date("2026-08-04T00:00:00+07:00"));
    expect(entryFor(entries, "/tra-cuu").lastModified).toEqual(new Date("2026-07-12T00:00:00+07:00"));
    expect(entryFor(entries, "/chinh-sach-bien-tap").lastModified).toEqual(
      new Date("2026-07-29T00:00:00+07:00"),
    );
    expect(entryFor(entries, "/pricing").lastModified).toEqual(new Date("2026-06-12T00:00:00+07:00"));
  });

  it("keeps the CMS article update date as the article lastmod", async () => {
    const entries = await sitemap();

    expect(entryFor(entries, "/kien-thuc-tu-vi/bai-viet-test").lastModified).toEqual(
      new Date("2026-07-20T00:00:00+07:00"),
    );
  });
});
