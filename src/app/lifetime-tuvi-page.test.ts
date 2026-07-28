import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LIFETIME_CARDS_PER_PAGE, lifetimeCards, lifetimeQuickIndexGroups } from "@/app/xem-tu-vi-tron-doi/page";

const pageSource = readFileSync("src/app/xem-tu-vi-tron-doi/page.tsx", "utf8");
const cardListSource = readFileSync("src/app/xem-tu-vi-tron-doi/lifetime-card-list.tsx", "utf8");
const sitemapSource = readFileSync("src/app/sitemap.ts", "utf8");
const llmsSource = readFileSync("public/llms.txt", "utf8");

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
    expect(cardListSource).toContain("Tổng quan trọn đời");
    expect(cardListSource).toContain("Công việc và tiền bạc");
    expect(cardListSource).toContain("Tình cảm và gia đạo");
    expect(cardListSource).toContain("Lưu ý vận hạn");
    expect(pageSource).not.toContain("<ChartForm");
  });

  it("does not expose placeholder future Tu vi tools as crawlable routes from this hub", () => {
    expect(pageSource).not.toContain("Các mục còn lại đã đặt trong tab Tử vi");
    expect(pageSource).not.toContain("Làm sau");
    expect(sitemapSource).not.toContain("/xem-tu-vi-2026");
    expect(sitemapSource).not.toContain("/tu-vi-tai-loc-dau-tu");
    expect(sitemapSource).not.toContain("/tuong-hop-la-so");
  });
  it("keeps pagination client-side with filter controls and a thumbnail on every card", () => {
    expect(cardListSource).toContain('"use client"');
    expect(cardListSource).toContain("useState(1)");
    expect(cardListSource).toContain("filteredCards");
    expect(cardListSource).toContain("Tìm tuổi theo năm sinh");
    expect(cardListSource).toContain("Nhập năm sinh, can chi hoặc nam/nữ");
    expect(cardListSource).toContain("Không tìm thấy tuổi phù hợp");
    expect(cardListSource).toContain("<Image");
    expect(cardListSource).toContain("Phân trang tử vi trọn đời");
    expect(lifetimeCards.length).toBeGreaterThan(LIFETIME_CARDS_PER_PAGE);
    expect(lifetimeCards.every((item) => Boolean(item.coverImage && item.coverAlt))).toBe(true);
  });

  it("exposes the full lifetime cluster to crawlers and AI discovery files", () => {
    const detailedCards = lifetimeCards.filter((item) => Boolean(item.detailsPath));
    const indexedCards = lifetimeQuickIndexGroups.flatMap((group) => group.items);

    expect(indexedCards).toHaveLength(detailedCards.length);
    expect(indexedCards.length).toBeGreaterThan(50);
    expect(pageSource).toContain("Danh mục đầy đủ các tuổi đã có bài chi tiết");
    expect(pageSource).toContain("Tuổi đang được đọc nhiều");
    expect(pageSource).toContain("source_slug=xem-tu-vi-tron-doi");
    expect(pageSource).not.toContain("Làm sau");
    expect(llmsSource).toContain("## Cụm Tử vi trọn đời theo tuổi");
    expect(llmsSource).toContain("https://lasotinhhoa.vn/xem-tu-vi-tron-doi/tu-vi-tron-doi-tuoi-ky-dau-1969-nam-mang");
  });

});
