import { describe, expect, it, vi } from "vitest";
import {
  deriveSearchConsoleOpportunities,
  querySearchAnalytics,
  refreshAccessToken,
} from "../../scripts/seo/search-console.mjs";

describe("Search Console integration", () => {
  it("refreshes an OAuth access token without exposing credentials", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ access_token: "access-token" }),
    }));

    const token = await refreshAccessToken({
      credentials: {
        clientId: "client-id",
        clientSecret: "client-secret",
        refreshToken: "refresh-token",
        tokenUri: "https://oauth2.googleapis.com/token",
      },
      fetchImpl,
    });

    expect(token).toBe("access-token");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://oauth2.googleapis.com/token",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "content-type": "application/x-www-form-urlencoded" }),
      }),
    );
  });

  it("queries Search Analytics for a Search Console property", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        rows: [{ keys: ["https://lasotinhhoa.vn/kien-thuc-tu-vi/a"], clicks: 2, impressions: 100, ctr: 0.02, position: 9.5 }],
      }),
    }));

    const result = await querySearchAnalytics({
      siteUrl: "https://lasotinhhoa.vn/",
      accessToken: "access-token",
      dateRange: { startDate: "2026-05-01", endDate: "2026-05-28" },
      dimensions: ["page"],
      rowLimit: 10,
      fetchImpl,
    });

    expect(result.rows).toHaveLength(1);
    expect(fetchImpl.mock.calls[0][0]).toContain(
      "/webmasters/v3/sites/https%3A%2F%2Flasotinhhoa.vn%2F/searchAnalytics/query",
    );
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toMatchObject({
      startDate: "2026-05-01",
      endDate: "2026-05-28",
      dimensions: ["page"],
      type: "web",
      rowLimit: 10,
    });
  });

  it("derives refresh opportunities from CTR and position patterns", () => {
    const opportunities = deriveSearchConsoleOpportunities({
      pages: [{ page: "https://lasotinhhoa.vn/kien-thuc-tu-vi/a", clicks: 1, impressions: 120, ctr: 0.008, position: 7 }],
      queries: [{ query: "tao la so tu vi", clicks: 0, impressions: 80, ctr: 0, position: 12 }],
      pageQueries: [
        {
          page: "https://lasotinhhoa.vn/kien-thuc-tu-vi/a",
          query: "lap la so tu vi chuan",
          clicks: 0,
          impressions: 30,
          ctr: 0,
          position: 8,
        },
      ],
    });

    expect(opportunities.map((item) => item.type)).toEqual(
      expect.arrayContaining(["refresh-title-meta", "expand-supporting-content", "refresh-page-section"]),
    );
  });
});
