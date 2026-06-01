import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const landingSource = readFileSync(fileURLToPath(new URL("./lap-la-so/page.tsx", import.meta.url)), "utf8");
const sitemapSource = readFileSync(fileURLToPath(new URL("./sitemap.ts", import.meta.url)), "utf8");

describe("Google Ads landing page", () => {
  it("uses a dedicated paid-search page with a chart-form conversion source", () => {
    expect(landingSource).toContain('path: "/lap-la-so"');
    expect(landingSource).toContain('<ChartForm adSource="google_ads_landing"');
    expect(landingSource).toContain("Đọc bản miễn phí trước");
  });

  it("keeps the ads landing page out of the organic sitemap to avoid near-duplicate SEO pages", () => {
    expect(landingSource).toContain("robots: { index: false, follow: true }");
    expect(sitemapSource).not.toContain("/lap-la-so");
  });
});
