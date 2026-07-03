import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/env";
import { listArticles } from "@/lib/data";
import { SUPPORT_STARS } from "@/lib/pseo-registry";
import { isSelfCanonicalArticle, robotsAllowsIndex } from "@/lib/seo";

const STATIC_LAST_MODIFIED = new Date("2026-05-21T00:00:00+07:00");

const TRUST_ROUTES = [
  { path: "/pricing", changeFrequency: "weekly" as const, priority: 0.6 },
  { path: "/chinh-sach-bao-mat", changeFrequency: "yearly" as const, priority: 0.4 },
  { path: "/dieu-khoan-su-dung", changeFrequency: "yearly" as const, priority: 0.4 },
  { path: "/lien-he", changeFrequency: "monthly" as const, priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await listArticles();
  const indexableArticles = articles.filter(
    (article) => robotsAllowsIndex(article.robots) && isSelfCanonicalArticle(article),
  );
  return [
    { url: APP_URL, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "daily", priority: 1 },
    { url: `${APP_URL}/kien-thuc-tu-vi`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "daily", priority: 0.8 },
    { url: `${APP_URL}/xem-ngay`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "daily", priority: 0.8 },
    { url: `${APP_URL}/tra-cuu`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.85 },
    { url: `${APP_URL}/tra-cuu/y-nghia-14-chinh-tinh`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.8 },
    { url: `${APP_URL}/tra-cuu/y-nghia-12-cung`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.8 },
    { url: `${APP_URL}/tra-cuu/phu-tinh`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.75 },
    ...SUPPORT_STARS.flatMap((entity) =>
      entity.canonicalPath
        ? [{
          url: `${APP_URL}${entity.canonicalPath}`,
          lastModified: STATIC_LAST_MODIFIED,
          changeFrequency: "monthly" as const,
          priority: 0.62,
        }]
        : [],
    ),
    ...TRUST_ROUTES.map((route) => ({
      url: `${APP_URL}${route.path}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...indexableArticles.map((article) => ({
      url: `${APP_URL}/kien-thuc-tu-vi/${article.slug}`,
      lastModified: article.updatedAt || article.publishedAt || STATIC_LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
