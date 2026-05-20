import { describe, expect, it } from "vitest";
import { scoreArticleSeo } from "@/lib/seo";

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
});
