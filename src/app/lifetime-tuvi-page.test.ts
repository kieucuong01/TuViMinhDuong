import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync("src/app/xem-tu-vi-tron-doi/page.tsx", "utf8");
const sitemapSource = readFileSync("src/app/sitemap.ts", "utf8");

describe("lifetime Tu vi landing page", () => {
  it("publishes an indexable lifetime reading route with the existing chart flow", () => {
    expect(pageSource).toContain("routeMetadata");
    expect(pageSource).toContain("webPageJsonLd");
    expect(pageSource).toContain("itemListJsonLd");
    expect(pageSource).toContain("faqJsonLd");
    expect(pageSource).toContain('path: "/xem-tu-vi-tron-doi"');
    expect(pageSource).toContain('<ChartForm compact adSource="tu_vi_tron_doi" />');
    expect(sitemapSource).toContain("/xem-tu-vi-tron-doi");
  });

  it("targets the SEO hub query without creating doorway routes", () => {
    expect(pageSource).toContain("Tử vi trọn đời cho nam nữ");
    expect(pageSource).toContain('data-answer-block="true"');
    expect(pageSource).toContain("Tử vi trọn đời tuổi Kỷ Dậu 1969 nam mạng");
    expect(pageSource).toContain("Tử vi trọn đời tuổi Nhâm Thìn 2012 nữ mạng");
    expect(pageSource).toContain("Tử vi trọn đời tuổi Ất Hợi 1995 nữ mạng");
    expect(pageSource).toContain("không tạo trang mỏng chỉ đổi năm sinh");
    expect(sitemapSource).not.toContain("/tu-vi-tron-doi-");
  });

  it("keeps future Tu vi tools visible as later work instead of linking empty routes", () => {
    expect(pageSource).toContain("Xem Tử vi 2026");
    expect(pageSource).toContain("Tử vi tài lộc & Đầu tư");
    expect(pageSource).toContain("Tương hợp lá số");
    expect(pageSource).toContain("không sinh trang mỏng");
    expect(sitemapSource).not.toContain("/xem-tu-vi-2026");
    expect(sitemapSource).not.toContain("/tu-vi-tai-loc-dau-tu");
    expect(sitemapSource).not.toContain("/tuong-hop-la-so");
  });
});
