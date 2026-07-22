import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { seedArticles } from "@/lib/content";

const contentSource = readFileSync("src/lib/content.ts", "utf8");
const pageSource = readFileSync("src/app/xem-tu-vi-tron-doi/page.tsx", "utf8");

const lifetimeArticleSlugs = [
  "tu-vi-tron-doi-tuoi-ky-dau-1969-nam-mang",
  "tu-vi-tron-doi-tuoi-ky-dau-1969-nu-mang",
  "tu-vi-tron-doi-tuoi-at-hoi-1995-nam-mang",
  "tu-vi-tron-doi-tuoi-at-hoi-1995-nu-mang",
  "tu-vi-tron-doi-tuoi-at-suu-1985-nam-mang",
];

describe("lifetime Tu vi SEO article cluster", () => {
  it("publishes the first five detailed lifetime age articles", () => {
    for (const slug of lifetimeArticleSlugs) {
      expect(contentSource).toContain(`slug: "${slug}"`);
      expect(contentSource).toContain(`canonicalUrl: \`/kien-thuc-tu-vi/\${input.slug}\``);
      expect(pageSource).toContain(`/kien-thuc-tu-vi/${slug}`);
    }
  });

  it("keeps the article template useful for SEO readers", () => {
    expect(contentSource).toContain("categoryId: \"cat-van-han\"");
    expect(contentSource).toContain("## Tóm tắt nhanh");
    expect(contentSource).toContain("## Công việc và đường sự nghiệp");
    expect(contentSource).toContain("## Tiền bạc, tích lũy và đầu tư");
    expect(contentSource).toContain("## Bảng đọc nhanh theo giai đoạn");
    expect(contentSource).toContain("## Đọc tiếp trong cụm Tử vi trọn đời");
    expect(contentSource).toContain("[trang Tử vi trọn đời](/xem-tu-vi-tron-doi)");
    expect(contentSource).toContain("[lập lá số tử vi miễn phí](/#lap-la-so)");
    expect(contentSource).toContain("[12 cung trong lá số tử vi](/kien-thuc-tu-vi/12-cung-trong-la-so-tu-vi)");
  });

  it("ships substantial reader-first content for each new age intent", () => {
    for (const slug of lifetimeArticleSlugs) {
      const article = seedArticles.find((item) => item.slug === slug);
      expect(article).toBeTruthy();
      expect(article?.categoryId).toBe("cat-van-han");
      expect(article?.canonicalUrl).toBe(`/kien-thuc-tu-vi/${slug}`);
      expect(article?.faqs).toHaveLength(3);

      const content = article?.content || "";
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      const internalLinkCount = (content.match(/\]\(\/[^)]+\)/g) || []).length;

      expect(wordCount).toBeGreaterThanOrEqual(1000);
      expect(internalLinkCount).toBeGreaterThanOrEqual(8);
      expect(content).not.toMatch(/chắc chắn (giàu|phát tài|hôn nhân|khỏi bệnh|thành công)/i);
    }
  });
});
