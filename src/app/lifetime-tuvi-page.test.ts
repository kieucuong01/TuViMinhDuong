import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LIFETIME_CARDS_PER_PAGE, lifetimeCards } from "@/app/xem-tu-vi-tron-doi/page";

const pageSource = readFileSync("src/app/xem-tu-vi-tron-doi/page.tsx", "utf8");
const cardListSource = readFileSync("src/app/xem-tu-vi-tron-doi/lifetime-card-list.tsx", "utf8");
const sitemapSource = readFileSync("src/app/sitemap.ts", "utf8");

describe("lifetime Tu vi landing page", () => {
  it("publishes an indexable lifetime reading route with structured SEO data", () => {
    expect(pageSource).toContain("routeMetadata");
    expect(pageSource).toContain("webPageJsonLd");
    expect(pageSource).toContain("itemListJsonLd");
    expect(pageSource).toContain("faqJsonLd");
    expect(pageSource).toContain('path: "/xem-tu-vi-tron-doi"');
    expect(sitemapSource).toContain("/xem-tu-vi-tron-doi");
  });

  it("shows detailed age readings immediately without requiring chart creation", () => {
    expect(pageSource).toContain("không cần lập lá số trước");
    expect(pageSource).toContain("Tử vi trọn đời tuổi Kỷ Dậu 1969 nam mạng");
    expect(pageSource).toContain("Tử vi trọn đời tuổi Nhâm Thìn 2012 nữ mạng");
    expect(pageSource).toContain("Tử vi trọn đời tuổi Ất Hợi 1995 nữ mạng");
    expect(pageSource).toContain("Tổng quan trọn đời");
    expect(pageSource).toContain("Công việc và tiền bạc");
    expect(pageSource).toContain("Tình cảm và gia đạo");
    expect(pageSource).toContain("Lưu ý vận hạn");
    expect(pageSource).not.toContain("<ChartForm");
  });

  it("keeps future Tu vi tools visible as later work instead of linking empty routes", () => {
    expect(pageSource).toContain("Xem Tử vi 2026");
    expect(pageSource).toContain("Tử vi tài lộc & Đầu tư");
    expect(pageSource).toContain("Tương hợp lá số");
    expect(sitemapSource).not.toContain("/xem-tu-vi-2026");
    expect(sitemapSource).not.toContain("/tu-vi-tai-loc-dau-tu");
    expect(sitemapSource).not.toContain("/tuong-hop-la-so");
  });
  it("keeps pagination client-side and a thumbnail on every card", () => {
    expect(cardListSource).toContain('"use client"');
    expect(cardListSource).toContain("useState(1)");
    expect(cardListSource).toContain("<Image");
    expect(cardListSource).toContain("Phân trang tử vi trọn đời");
    expect(lifetimeCards.length).toBeGreaterThan(LIFETIME_CARDS_PER_PAGE);
    expect(lifetimeCards.every((item) => Boolean(item.coverImage && item.coverAlt))).toBe(true);
  });
});
