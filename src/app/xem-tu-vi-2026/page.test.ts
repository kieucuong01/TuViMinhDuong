import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync("src/app/xem-tu-vi-2026/page.tsx", "utf8");
const headerSource = readFileSync("src/components/site-header.tsx", "utf8");
const sitemapSource = readFileSync("src/app/sitemap.ts", "utf8");

describe("xem tu vi 2026 landing", () => {
  it("answers the annual intent and starts a fixed 2026 chart journey", () => {
    expect(pageSource).toContain('data-answer-block="true"');
    expect(pageSource).toContain('experience="annual-2026"');
    expect(pageSource).toContain('sourceSlug="xem-tu-vi-2026"');
    expect(pageSource).toContain('id="lap-la-so-2026"');
    expect(pageSource).toContain("Năm Bính Ngọ 2026");
    expect(pageSource).toContain("công việc");
    expect(pageSource).toContain("tài chính");
    expect(pageSource).toContain("tình cảm");
    expect(pageSource).toContain("sức khỏe");
  });

  it("ships extractable schema, real FAQs, trust limits, and contextual links", () => {
    expect(pageSource).toContain("webPageJsonLd");
    expect(pageSource).toContain("webApplicationJsonLd");
    expect(pageSource).toContain("faqJsonLd");
    expect(pageSource).toContain("/xem-tu-vi-tron-doi");
    expect(pageSource).toContain("/tu-vi-tai-loc-dau-tu");
    expect(pageSource).toContain("/xem-ngay");
    expect(pageSource).toContain("/xem-tuoi");
    expect(pageSource).toContain("/phuong-phap-luan");
    expect(pageSource).toContain('dateTime="2026-08-09"');
  });

  it("replaces the navigation placeholder and enters the static sitemap", () => {
    expect(headerSource).toContain('href: "/xem-tu-vi-2026"');
    expect(headerSource).not.toContain("Sẽ làm sau.");
    expect(sitemapSource).toContain("annual2026: new Date");
    expect(sitemapSource).toContain('`${APP_URL}/xem-tu-vi-2026`');
  });
});
