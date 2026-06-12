import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  articleJsonLd,
  offerCatalogJsonLd,
  isSelfCanonicalArticle,
  organizationJsonLd,
  robotsAllowsIndex,
  scoreArticleSeo,
  websiteJsonLd,
} from "@/lib/seo";

describe("SEO scoring", () => {
  it("rewards complete article metadata and structure", () => {
    const strong = scoreArticleSeo({
      title: "Cách đọc cung Mệnh tử vi cho người mới",
      slug: "cach-doc-cung-menh-trong-tu-vi",
      excerpt: "Tìm hiểu cách đọc cung Mệnh tử vi theo hướng ứng dụng, dễ hiểu và có thể kết hợp cùng cung Thân.",
      focusKeyword: "cung mệnh tử vi",
      metaTitle: "Cách đọc cung Mệnh tử vi cho người mới",
      metaDescription: "Tìm hiểu cách đọc cung Mệnh tử vi, các yếu tố cần xem cùng Cung Thân, chính tinh, phụ tinh và vận hạn trong lá số cá nhân.",
      canonicalUrl: "/kien-thuc-tu-vi/cach-doc-cung-menh-trong-tu-vi",
      coverAlt: "Minh họa cung Mệnh trong bàn lá số tử vi",
      schemaType: "Article",
      content: `Cung mệnh tử vi là nền tảng quan trọng khi đọc lá số.

## Cung Mệnh cho biết gì

${"Nội dung phân tích ứng dụng. ".repeat(130)}

## Đọc cùng Cung Thân

Xem thêm [Cung Thân](/kien-thuc-tu-vi/cung-menh-cung-than).`,
    });

    const weak = scoreArticleSeo({
      title: "Mệnh",
      content: "Bài ngắn.",
    });

    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.score).toBeGreaterThanOrEqual(70);
  });

  it("matches Vietnamese keywords against clean URL slugs", () => {
    const result = scoreArticleSeo({
      title: "Tử vi tháng 6/2026: Cách xem vận tháng cá nhân",
      slug: "tu-vi-thang-6-2026",
      excerpt: "Tử vi tháng 6/2026 nên được đọc từ lá số gốc, đại vận, lưu niên và ngày tốt xấu để lên kế hoạch bình tĩnh hơn.",
      focusKeyword: "tử vi tháng 6 2026",
      metaTitle: "Tử vi tháng 6/2026: Cách xem vận tháng cá nhân",
      metaDescription: "Tử vi tháng 6/2026 nên được đọc từ lá số gốc, đại vận, lưu niên và ngày tốt xấu để lên kế hoạch công việc, tiền bạc, sức khỏe.",
      canonicalUrl: "/kien-thuc-tu-vi/tu-vi-thang-6-2026",
      coverAlt: "Lịch tháng 6 năm 2026 và lá số tử vi cá nhân",
      schemaType: "Article",
      content: `Tử vi tháng 6 2026 là chủ đề nhiều người tìm trước khi bước sang tháng mới.

## Cách đọc vận tháng

${"Nên đối chiếu lá số gốc, đại vận, lưu niên và bối cảnh thực tế. ".repeat(90)}

## Đọc cùng ngày tốt xấu

Xem thêm [xem ngày tốt xấu](/xem-ngay).`,
    });

    expect(result.checks.find((check) => check.label === "Từ khóa trong slug")?.passed).toBe(true);
    expect(result.score).toBe(100);
  });
});

describe("Structured data", () => {
  it("keeps site name signals aligned with the public brand", () => {
    expect(websiteJsonLd()).toMatchObject({
      "@type": "WebSite",
      name: "Lá số tinh hoa",
      alternateName: expect.arrayContaining(["La so tinh hoa", "Lá số"]),
      url: expect.stringMatching(/^https?:\/\//),
    });

    expect(organizationJsonLd()).toMatchObject({
      "@type": "Organization",
      name: "Lá số tinh hoa",
      alternateName: expect.arrayContaining(["La so tinh hoa", "Lá số"]),
      logo: expect.stringContaining("/favicon-96x96.png"),
    });
  });

  it("uses a crawl-friendly raster publisher logo for articles", () => {
    const jsonLd = articleJsonLd({
      title: "Cách đọc cung Mệnh tử vi",
      slug: "cach-doc-cung-menh-tu-vi",
      excerpt: "Hướng dẫn đọc cung Mệnh tử vi dễ hiểu.",
    });

    expect(jsonLd.publisher.logo.url).toContain("/favicon-96x96.png");
  });

  it("describes visible pricing offers with an OfferCatalog", () => {
    const catalog = offerCatalogJsonLd({
      name: "Bảng giá luận giải tử vi",
      description: "Các phần luận giải có thể mở bằng xu trên Lá số tinh hoa.",
      url: "/pricing",
      offers: [
        { name: "Luận giải toàn bộ", description: "Tổng quan, 12 cung và vận hạn.", priceCoins: 199 },
      ],
    });

    expect(catalog).toMatchObject({
      "@type": "OfferCatalog",
      name: "Bảng giá luận giải tử vi",
      url: expect.stringMatching(/\/pricing$/),
      itemListElement: [
        {
          "@type": "Offer",
          name: "Luận giải toàn bộ",
          price: 199000,
          priceCurrency: "VND",
        },
      ],
    });
  });
});

describe("SEO URL guards", () => {
  it("normalizes relative URLs against the public app URL", () => {
    expect(absoluteUrl("/kien-thuc-tu-vi")).toMatch(/^https?:\/\/.+\/kien-thuc-tu-vi$/);
    expect(absoluteUrl("https://example.com/custom")).toBe("https://example.com/custom");
  });

  it("keeps noindex and non-self-canonical articles out of indexable sets", () => {
    expect(robotsAllowsIndex("index,follow")).toBe(true);
    expect(robotsAllowsIndex("noindex,nofollow")).toBe(false);
    expect(isSelfCanonicalArticle({ slug: "cung-menh", canonicalUrl: "/kien-thuc-tu-vi/cung-menh" })).toBe(true);
    expect(isSelfCanonicalArticle({ slug: "cung-menh", canonicalUrl: "/kien-thuc-tu-vi/bai-khac" })).toBe(false);
  });
});
