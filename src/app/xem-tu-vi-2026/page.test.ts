import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync("src/app/xem-tu-vi-2026/page.tsx", "utf8");
const chartFormSource = readFileSync("src/components/chart-form.tsx", "utf8");
const headerSource = readFileSync("src/components/site-header.tsx", "utf8");
const sitemapSource = readFileSync("src/app/sitemap.ts", "utf8");
const globalCss = readFileSync("src/app/globals.css", "utf8");

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
  it("keeps the annual 2026 birth date controls inside mobile width", () => {
    expect(globalCss).toContain(".annual-2026-form-card .chart-birth-field .birth-date-grid");
    expect(globalCss).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
  });

  it("keeps the hero journey fast and the annual form compact", () => {
    expect(pageSource).toContain('className="annual-2026-hero-actions"');
    expect(pageSource).toContain('data-hero-primary-cta="annual-2026-form"');
    expect(pageSource).toContain('href="#lap-la-so-2026"');
    expect(pageSource).toContain("compact={true}");
    expect(globalCss).toContain(".annual-2026-hero-actions");
    expect(globalCss).toContain(".annual-2026-form-card .chart-form.compact .form-grid");
    expect(globalCss).toContain(".annual-2026-form-card .chart-form.compact .chart-birth-field");
    expect(globalCss).toContain("grid-column: 1 / -1;");
  });

  it("labels the name field clearly and explains the privacy-safe input", () => {
    expect(chartFormSource).toContain('htmlFor="chart-full-name"');
    expect(chartFormSource).toContain('id="chart-full-name"');
    expect(chartFormSource).toContain('autoComplete="name"');
    expect(chartFormSource).toContain('aria-describedby="chart-name-helper"');
    expect(chartFormSource).toContain('id="chart-name-helper"');
    expect(globalCss).toContain(".chart-field-helper");
  });
});
