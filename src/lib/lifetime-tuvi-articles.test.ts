import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { generateStaticParams } from "@/app/xem-tu-vi-tron-doi/[slug]/page";
import { lifetimeCards } from "@/app/xem-tu-vi-tron-doi/page";
import { seedArticles } from "@/lib/content";
import {
  adultExpansionLifetimeAgeArticleInputs,
  adultExpansionLifetimeArticleSlugs,
  historicalLifetimeAgeArticleInputs,
  historicalLifetimeArticleSlugs,
} from "@/lib/lifetime-age-data";

vi.mock("server-only", () => ({}));

const contentSource = readFileSync("src/lib/content.ts", "utf8");
const lifetimeArticleRouteSource = readFileSync("src/app/xem-tu-vi-tron-doi/[slug]/page.tsx", "utf8");
const rootArticleRouteSource = readFileSync("src/app/[slug]/page.tsx", "utf8");
const knowledgePageSource = readFileSync("src/app/kien-thuc-tu-vi/page.tsx", "utf8");
const knowledgeArticleRouteSource = readFileSync("src/app/kien-thuc-tu-vi/[slug]/page.tsx", "utf8");
const sitemapSource = readFileSync("src/app/sitemap.ts", "utf8");

const lifetimeArticleSlugs = [
  "tu-vi-tron-doi-tuoi-ky-dau-1969-nam-mang",
  "tu-vi-tron-doi-tuoi-ky-dau-1969-nu-mang",
  "tu-vi-tron-doi-tuoi-at-hoi-1995-nam-mang",
  "tu-vi-tron-doi-tuoi-at-hoi-1995-nu-mang",
  "tu-vi-tron-doi-tuoi-at-suu-1985-nam-mang",
  "tu-vi-tron-doi-tuoi-at-suu-1985-nu-mang",
  "tu-vi-tron-doi-tuoi-at-mao-1975-nam-mang",
  "tu-vi-tron-doi-tuoi-at-mao-1975-nu-mang",
  "tu-vi-tron-doi-tuoi-giap-ty-1984-nam-mang",
  "tu-vi-tron-doi-tuoi-giap-ty-1984-nu-mang",
  ...adultExpansionLifetimeArticleSlugs,
  ...historicalLifetimeArticleSlugs,
];

describe("lifetime Tu vi SEO article cluster", () => {
  it("publishes the detailed lifetime age articles that are linked from the hub", () => {
    const hubDetailPaths = lifetimeCards.map((item) => item.detailsPath).filter(Boolean);

    for (const slug of lifetimeArticleSlugs) {
      expect(seedArticles.some((item) => item.slug === slug)).toBe(true);
      expect(hubDetailPaths).toContain(`/xem-tu-vi-tron-doi/${slug}`);
    }

    expect(contentSource).toContain("canonicalUrl: `/xem-tu-vi-tron-doi/${input.slug}`");
  });

  it("covers every year from 1940 through 1960 for both genders", () => {
    expect(historicalLifetimeArticleSlugs).toHaveLength(42);
    expect(new Set(historicalLifetimeArticleSlugs).size).toBe(42);

    for (let year = 1940; year <= 1960; year += 1) {
      const inputsForYear = historicalLifetimeAgeArticleInputs.filter((item) => item.year === String(year));
      expect(inputsForYear.map((item) => item.gender).sort()).toEqual(["nam mạng", "nữ mạng"]);
      expect(inputsForYear.every((input) => seedArticles.some((articleItem) => articleItem.slug === input.slug))).toBe(true);
    }
  });

  it("adds the next 5 adult lifetime age intents without duplicating live coverage", () => {
    expect(adultExpansionLifetimeArticleSlugs).toEqual([
      "tu-vi-tron-doi-tuoi-nham-tuat-1982-nam-mang",
      "tu-vi-tron-doi-tuoi-nham-tuat-1982-nu-mang",
      "tu-vi-tron-doi-tuoi-quy-hoi-1983-nam-mang",
      "tu-vi-tron-doi-tuoi-quy-hoi-1983-nu-mang",
      "tu-vi-tron-doi-tuoi-canh-ngo-1990-nam-mang",
    ]);
    expect(new Set(adultExpansionLifetimeArticleSlugs).size).toBe(5);
    expect(adultExpansionLifetimeAgeArticleInputs.at(-1)?.siblingLink).toBeUndefined();
  });

  it("exposes the historical lifetime articles through lifetime section static params", async () => {
    const params = await generateStaticParams();
    const lifetimeSlugs = params.map((item) => item.slug);

    for (const slug of adultExpansionLifetimeArticleSlugs) {
      expect(lifetimeSlugs).toContain(slug);
    }

    for (const slug of historicalLifetimeArticleSlugs) {
      expect(lifetimeSlugs).toContain(slug);
    }
  });

  it("keeps the article template useful for SEO readers", () => {
    expect(contentSource).toContain("categoryId: \"cat-van-han\"");
    expect(contentSource).toContain("## Tóm tắt nhanh");
    expect(contentSource).toContain("## Cơ sở tử vi dùng trong bài");
    expect(contentSource).toContain("## Công việc và đường sự nghiệp");
    expect(contentSource).toContain("## Tiền bạc, tích lũy và đầu tư");
    expect(contentSource).toContain("## Hợp kỵ, phong thủy và việc nên cân nhắc");
    expect(contentSource).toContain("## Bảng đọc nhanh theo giai đoạn");
    expect(contentSource).toContain("## Đọc tiếp trong cụm Tử vi trọn đời");
    expect(contentSource).toContain("[trang Tử vi trọn đời](/xem-tu-vi-tron-doi)");
    expect(contentSource).toContain("[lập lá số tử vi miễn phí](/#lap-la-so)");
    expect(contentSource).toContain("[12 cung trong lá số tử vi](/kien-thuc-tu-vi/12-cung-trong-la-so-tu-vi)");
    expect(contentSource).toContain("So sánh thêm với [");
  });

  it("ships substantial reader-first content for each new age intent", () => {
    for (const slug of lifetimeArticleSlugs) {
      const article = seedArticles.find((item) => item.slug === slug);
      expect(article).toBeTruthy();
      expect(article?.categoryId).toBe("cat-van-han");
      expect(article?.canonicalUrl).toBe(`/xem-tu-vi-tron-doi/${slug}`);
      expect(article?.faqs).toHaveLength(3);

      const content = article?.content || "";
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      const internalLinkCount = (content.match(/\]\(\/[^)]+\)/g) || []).length;

      expect(wordCount).toBeGreaterThanOrEqual(1000);
      expect(internalLinkCount).toBeGreaterThanOrEqual(8);
      expect(content).not.toMatch(/chắc chắn (giàu|phát tài|hôn nhân|khỏi bệnh|thành công)/i);
    }
  });

  it("serves lifetime articles under /xem-tu-vi-tron-doi and keeps them out of /kien-thuc-tu-vi", () => {
    expect(lifetimeArticleRouteSource).toContain("sectionName=\"Tử vi trọn đời\"");
    expect(lifetimeArticleRouteSource).toContain("lifetimeTuViArticlePath");
    expect(rootArticleRouteSource).toContain("redirect(lifetimeTuViArticlePath(slug))");
    expect(knowledgeArticleRouteSource).toContain("redirect(canonicalPath)");
    expect(knowledgePageSource).toContain("!isLifetimeTuViSlug(article.slug)");
    expect(sitemapSource).toContain("articlePath(article)");
  });});
