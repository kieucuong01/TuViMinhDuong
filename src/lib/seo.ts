import { APP_NAME, APP_URL } from "@/lib/env";
import { articlePath, isLifetimeTuViSlug } from "@/lib/article-path";
import { slugify } from "@/lib/format";

export type SeoInput = {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  focusKeyword?: string;
  metaTitle?: string;
  metaDescription?: string;
  coverAlt?: string;
  canonicalUrl?: string;
  internalLinks?: number;
  schemaType?: string;
};

export type SeoResult = {
  score: number;
  checks: { label: string; passed: boolean; points: number; hint: string }[];
};

export function absoluteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  const path = value.startsWith("/") ? value : `/${value}`;
  return `${APP_URL}${path === "/" ? "" : path}`;
}

function normalizedUrl(value: string) {
  return value.replace(/\/$/, "");
}

export function robotsAllowsIndex(robots?: string | null) {
  const value = (robots || "index,follow").toLowerCase();
  return !value.includes("noindex") && !value.includes("none");
}

export function isSelfCanonicalArticle(article: { slug: string; canonicalUrl?: string | null }) {
  const expectedPath = isLifetimeTuViSlug(article.slug) ? `/${article.slug}` : `/kien-thuc-tu-vi/${article.slug}`;
  const expected = absoluteUrl(expectedPath);
  const canonical = article.canonicalUrl?.trim() ? absoluteUrl(article.canonicalUrl) : expected;
  return normalizedUrl(canonical) === normalizedUrl(expected);
}

function normalizedKeywordText(value: string) {
  return slugify(value).replace(/-/g, " ");
}

function includesKeyword(value: string | undefined, keyword: string) {
  const normalizedKeyword = normalizedKeywordText(keyword);
  if (!value || !normalizedKeyword) return false;
  return normalizedKeywordText(value).includes(normalizedKeyword);
}

function wordCount(content: string) {
  return content.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
}

export function scoreArticleSeo(input: SeoInput): SeoResult {
  const keyword = input.focusKeyword?.trim() || input.title.split(/\s+/).slice(0, 2).join(" ");
  const slug = input.slug || slugify(input.title);
  const metaTitle = input.metaTitle || input.title;
  const metaDescription = input.metaDescription || input.excerpt || "";
  const h2Count = (input.content.match(/^##\s+/gm) || []).length;
  const imageCount = (input.content.match(/!\[[^\]]*]/g) || []).length;
  const altOk = imageCount > 0 ? !/!\[]/.test(input.content) : Boolean(input.coverAlt?.trim());
  const links = input.internalLinks ?? (input.content.match(/\]\(\/[^)]+\)/g) || []).length;
  const words = wordCount(input.content);

  const checks = [
    {
      label: "Meta title 35-60 ký tự",
      passed: metaTitle.length >= 35 && metaTitle.length <= 60,
      points: 12,
      hint: "Viết tiêu đề đủ cụ thể, không quá ngắn hoặc quá dài.",
    },
    {
      label: "Meta description 120-160 ký tự",
      passed: metaDescription.length >= 120 && metaDescription.length <= 160,
      points: 12,
      hint: "Mô tả nên tóm tắt lợi ích và chứa từ khóa chính.",
    },
    {
      label: "Từ khóa trong title",
      passed: includesKeyword(metaTitle, keyword),
      points: 10,
      hint: "Đưa focus keyword vào title một cách tự nhiên.",
    },
    {
      label: "Từ khóa trong slug",
      passed: includesKeyword(slug.replace(/-/g, " "), keyword),
      points: 8,
      hint: "Slug nên ngắn, dễ đọc và có từ khóa.",
    },
    {
      label: "Từ khóa ở đoạn đầu",
      passed: includesKeyword(input.content.slice(0, 280), keyword),
      points: 8,
      hint: "Nhắc chủ đề chính sớm để người đọc và crawler hiểu bài.",
    },
    {
      label: "Có cấu trúc H2",
      passed: h2Count >= 2,
      points: 10,
      hint: "Chia bài bằng ít nhất hai heading H2.",
    },
    {
      label: "Ảnh có alt text",
      passed: altOk,
      points: 8,
      hint: "Không để alt rỗng cho ảnh trong bài.",
    },
    {
      label: "Có internal link",
      passed: links >= 1,
      points: 10,
      hint: "Liên kết tới bài hoặc trang liên quan trong website.",
    },
    {
      label: "Có canonical URL",
      passed: Boolean(input.canonicalUrl),
      points: 6,
      hint: "Canonical giúp tránh trùng lặp nội dung.",
    },
    {
      label: "Schema phù hợp",
      passed: Boolean(input.schemaType),
      points: 6,
      hint: "Dùng Article hoặc FAQPage khi phù hợp.",
    },
    {
      label: "Độ dài bài tối thiểu",
      passed: words >= 500,
      points: 10,
      hint: "Bài kiến thức nên có ít nhất khoảng 500 từ.",
    },
  ];

  return {
    score: checks.reduce((total, check) => total + (check.passed ? check.points : 0), 0),
    checks,
  };
}

export function articleJsonLd(article: {
  title: string;
  slug: string;
  excerpt: string;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  coverImage?: string | null;
  canonicalUrl?: string | null;
}) {
  const url = absoluteUrl(articlePath(article));
  const image = article.coverImage
    ? article.coverImage.startsWith("http")
      ? article.coverImage
      : absoluteUrl(article.coverImage)
    : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: "vi-VN",
    isAccessibleForFree: true,
    image: image ? [image] : undefined,
    datePublished: article.publishedAt || undefined,
    dateModified: article.updatedAt || article.publishedAt || undefined,
    author: { "@type": "Organization", name: APP_NAME },
    publisher: {
      "@type": "Organization",
      name: APP_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${APP_URL}/favicon-96x96.png`,
      },
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

export function webPageJsonLd(page: { name: string; description: string; url: string; breadcrumb?: { name: string; url: string }[] }) {
  const url = absoluteUrl(page.url);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.name,
    description: page.description,
    url,
    inLanguage: "vi-VN",
    isPartOf: {
      "@type": "WebSite",
      name: APP_NAME,
      url: APP_URL,
    },
    breadcrumb: page.breadcrumb?.length ? breadcrumbJsonLd(page.breadcrumb) : undefined,
  };
}

export function itemListJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.url),
    })),
  };
}

export function offerCatalogJsonLd(catalog: {
  name: string;
  description: string;
  url: string;
  offers: { name: string; description: string; priceCoins: number }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: catalog.name,
    description: catalog.description,
    url: absoluteUrl(catalog.url),
    itemListElement: catalog.offers.map((offer) => ({
      "@type": "Offer",
      name: offer.name,
      description: offer.description,
      price: offer.priceCoins * 1000,
      priceCurrency: "VND",
      availability: "https://schema.org/InStock",
      url: absoluteUrl(catalog.url),
    })),
  };
}

export function webApplicationJsonLd(app: { name: string; description: string; url: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: app.name,
    description: app.description,
    url: absoluteUrl(app.url),
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Any",
    inLanguage: "vi-VN",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: 0,
      priceCurrency: "VND",
    },
    provider: {
      "@type": "Organization",
      name: APP_NAME,
      url: APP_URL,
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: APP_NAME,
    alternateName: ["La so tinh hoa", "Lá số"],
    url: APP_URL,
    inLanguage: "vi-VN",
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: APP_NAME,
    alternateName: ["La so tinh hoa", "Lá số"],
    url: APP_URL,
    logo: `${APP_URL}/favicon-96x96.png`,
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
