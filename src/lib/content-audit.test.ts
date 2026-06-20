import { describe, expect, it } from "vitest";
import { auditArticles } from "@/lib/content-audit";
import type { ArticleView } from "@/lib/content";

function makeArticle(slug: string, overrides: Partial<ArticleView> = {}): ArticleView {
  return {
    id: `seed-${slug}`,
    title: `Bai viet ${slug}`,
    slug,
    excerpt: "Mo ta huu ich cho nguoi doc.",
    content: `Mo dau rieng cho ${slug}.

![Minh hoa noi dung ${slug}](/articles/${slug}.webp)

## Bang du lieu

| Tin hieu | Cach doc |
| --- | --- |
| Mot | Hai |

## Dieu kien thay doi

- Dieu kien mot
- Dieu kien hai

## Phan tich

Noi dung phan tich nhan qua rieng cho ${slug}.

## Gioi han

Noi dung chi mang tinh tham khao.

## Thu tren la so

[Lap la so](/#lap-la-so), [doc cung Menh](/kien-thuc-tu-vi/cung-menh-cung-than), [doc Dai van](/kien-thuc-tu-vi/dai-van-la-gi), [doc 12 cung](/kien-thuc-tu-vi/12-cung-trong-la-so-tu-vi), [doc chinh tinh](/kien-thuc-tu-vi/sao-chinh-tinh-tu-vi).`,
    status: "published",
    coverImage: `/articles/${slug}.webp`,
    coverAlt: `Minh hoa noi dung rieng cho bai viet ${slug}`,
    focusKeyword: `tu khoa ${slug}`,
    metaTitle: `Tieu de SEO ${slug}`,
    metaDescription: `Mo ta SEO rieng cho bai viet ${slug}, giai quyet mot nhu cau cu the.`,
    canonicalUrl: `/kien-thuc-tu-vi/${slug}`,
    robots: "index,follow",
    ogImage: `/articles/${slug}.webp`,
    schemaType: "Article",
    publishedAt: new Date("2026-06-19T00:00:00+07:00"),
    updatedAt: new Date("2026-06-19T00:00:00+07:00"),
    ...overrides,
  };
}

describe("content audit", () => {
  it("reports duplicate metadata and repeated long sections", () => {
    const repeatedSection = `## Khung lap lai

Day la mot doan noi dung dai bi sao chep giua nhieu bai viet. No khong tao them gia tri rieng cho tung chu de va chi lam bai viet dai hon mot cach may moc. Doan nay du dai de bo audit nhan dien nhu mot khoi noi dung trung lap can sua.`;
    const articles = [
      makeArticle("mot", {
        focusKeyword: "tu khoa trung",
        content: `${makeArticle("mot").content}\n\n${repeatedSection}`,
      }),
      makeArticle("hai", {
        focusKeyword: "tu khoa trung",
        canonicalUrl: "/kien-thuc-tu-vi/mot",
        content: `${makeArticle("hai").content}\n\n${repeatedSection}`,
      }),
    ];

    const findings = auditArticles(articles);
    const codes = findings.map((finding) => finding.code);

    expect(codes).toContain("duplicate-focus-keyword");
    expect(codes).toContain("duplicate-canonical");
    expect(codes).toContain("repeated-section");
  });

  it("reports missing reader value and risky deterministic claims", () => {
    const article = makeArticle("mong", {
      content: `## Ket luan

Ban chac chan se giau va khong the that bai.`,
      coverImage: "/articles/mong.svg",
      ogImage: "/articles/mong.svg",
    });

    const findings = auditArticles([article]);
    const codes = findings.map((finding) => finding.code);

    expect(codes).toContain("missing-conversion-cta");
    expect(codes).toContain("insufficient-internal-links");
    expect(codes).toContain("insufficient-headings");
    expect(codes).toContain("insufficient-structured-blocks");
    expect(codes).toContain("unsafe-deterministic-claim");
    expect(codes).toContain("non-webp-cover");
  });
});
