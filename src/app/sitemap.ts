import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/env";
import { listArticleIndex } from "@/lib/data";
import { DATE_PURPOSE_PAGES } from "@/lib/date-purpose-pages";
import { AGE_TOOL_PAGES } from "@/lib/age-tools";
import { SUPPORT_STARS } from "@/lib/pseo-registry";
import { articlePath } from "@/lib/article-path";
import { isSelfCanonicalArticle, robotsAllowsIndex } from "@/lib/seo";
import { lifetimeContentUpdatedAtDate } from "@/lib/lifetime-age-data";

const LAST_MODIFIED = {
  home: new Date("2026-07-16T00:00:00+07:00"),
  lifetime: lifetimeContentUpdatedAtDate,
  annual2026: new Date("2026-08-09T00:00:00+07:00"),
  wealth: new Date("2026-08-03T00:00:00+07:00"),
  compatibility: new Date("2026-08-04T00:00:00+07:00"),
  knowledge: new Date("2026-07-30T00:00:00+07:00"),
  dateTools: new Date("2026-07-28T00:00:00+07:00"),
  ageTools: new Date("2026-07-28T00:00:00+07:00"),
  lookupHubs: new Date("2026-07-12T00:00:00+07:00"),
  supportStars: new Date("2026-07-13T00:00:00+07:00"),
  articleFallback: new Date("2026-05-21T00:00:00+07:00"),
} as const;

const TRUST_ROUTES = [
  { path: "/ai-info", lastModified: new Date("2026-08-22T00:00:00+07:00"), changeFrequency: "monthly" as const, priority: 0.64 },
  { path: "/huong-dan-chon-web-lap-la-so-tu-vi", lastModified: new Date("2026-08-22T00:00:00+07:00"), changeFrequency: "monthly" as const, priority: 0.66 },
  { path: "/gioi-thieu", lastModified: new Date("2026-07-21T00:00:00+07:00"), changeFrequency: "monthly" as const, priority: 0.62 },
  { path: "/phuong-phap-luan", lastModified: new Date("2026-07-29T00:00:00+07:00"), changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/tac-gia", lastModified: new Date("2026-07-29T00:00:00+07:00"), changeFrequency: "monthly" as const, priority: 0.58 },
  { path: "/chinh-sach-bien-tap", lastModified: new Date("2026-07-29T00:00:00+07:00"), changeFrequency: "monthly" as const, priority: 0.58 },
  { path: "/pricing", lastModified: new Date("2026-06-12T00:00:00+07:00"), changeFrequency: "weekly" as const, priority: 0.6 },
  { path: "/chinh-sach-bao-mat", lastModified: new Date("2026-06-12T00:00:00+07:00"), changeFrequency: "yearly" as const, priority: 0.4 },
  { path: "/dieu-khoan-su-dung", lastModified: new Date("2026-06-12T00:00:00+07:00"), changeFrequency: "yearly" as const, priority: 0.4 },
  { path: "/lien-he", lastModified: new Date("2026-06-25T00:00:00+07:00"), changeFrequency: "monthly" as const, priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await listArticleIndex();
  const indexableArticles = articles.filter(
    (article) => robotsAllowsIndex(article.robots) && isSelfCanonicalArticle(article),
  );
  return [
    { url: APP_URL, lastModified: LAST_MODIFIED.home, changeFrequency: "daily", priority: 1 },
    { url: `${APP_URL}/xem-tu-vi-tron-doi`, lastModified: LAST_MODIFIED.lifetime, changeFrequency: "weekly", priority: 0.86 },
    { url: `${APP_URL}/xem-tu-vi-2026`, lastModified: LAST_MODIFIED.annual2026, changeFrequency: "weekly", priority: 0.88 },
    { url: `${APP_URL}/tu-vi-tai-loc-dau-tu`, lastModified: LAST_MODIFIED.wealth, changeFrequency: "weekly", priority: 0.84 },
    { url: `${APP_URL}/tuong-hop-la-so`, lastModified: LAST_MODIFIED.compatibility, changeFrequency: "weekly", priority: 0.84 },
    { url: `${APP_URL}/kien-thuc-tu-vi`, lastModified: LAST_MODIFIED.knowledge, changeFrequency: "daily", priority: 0.8 },
    { url: `${APP_URL}/xem-ngay`, lastModified: LAST_MODIFIED.dateTools, changeFrequency: "daily", priority: 0.8 },
    ...DATE_PURPOSE_PAGES.map((page) => ({
      url: `${APP_URL}/xem-ngay/${page.slug}`,
      lastModified: LAST_MODIFIED.dateTools,
      changeFrequency: "weekly" as const,
      priority: 0.72,
    })),
    { url: `${APP_URL}/xem-tuoi`, lastModified: LAST_MODIFIED.ageTools, changeFrequency: "weekly", priority: 0.82 },
    ...AGE_TOOL_PAGES.map((page) => ({
      url: `${APP_URL}/xem-tuoi/${page.slug}`,
      lastModified: LAST_MODIFIED.ageTools,
      changeFrequency: "weekly" as const,
      priority: 0.74,
    })),
    { url: `${APP_URL}/tra-cuu`, lastModified: LAST_MODIFIED.lookupHubs, changeFrequency: "weekly", priority: 0.85 },
    { url: `${APP_URL}/tra-cuu/y-nghia-14-chinh-tinh`, lastModified: LAST_MODIFIED.lookupHubs, changeFrequency: "weekly", priority: 0.8 },
    { url: `${APP_URL}/tra-cuu/y-nghia-12-cung`, lastModified: LAST_MODIFIED.lookupHubs, changeFrequency: "weekly", priority: 0.8 },
    { url: `${APP_URL}/tra-cuu/phu-tinh`, lastModified: LAST_MODIFIED.lookupHubs, changeFrequency: "weekly", priority: 0.75 },
    ...SUPPORT_STARS.flatMap((entity) =>
      entity.canonicalPath
        ? [{
          url: `${APP_URL}${entity.canonicalPath}`,
          lastModified: LAST_MODIFIED.supportStars,
          changeFrequency: "monthly" as const,
          priority: 0.62,
        }]
        : [],
    ),
    ...TRUST_ROUTES.map((route) => ({
      url: `${APP_URL}${route.path}`,
      lastModified: route.lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...indexableArticles.map((article) => ({
      url: `${APP_URL}${articlePath(article)}`,
      lastModified: article.updatedAt || article.publishedAt || LAST_MODIFIED.articleFallback,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
