import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/env";
import { listArticles } from "@/lib/data";
import { isSelfCanonicalArticle, robotsAllowsIndex } from "@/lib/seo";

const STATIC_LAST_MODIFIED = new Date("2026-05-21T00:00:00+07:00");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await listArticles();
  const indexableArticles = articles.filter(
    (article) => robotsAllowsIndex(article.robots) && isSelfCanonicalArticle(article),
  );
  return [
    { url: APP_URL, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "daily", priority: 1 },
    { url: `${APP_URL}/kien-thuc-tu-vi`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "daily", priority: 0.8 },
    { url: `${APP_URL}/xem-ngay`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "daily", priority: 0.8 },
    { url: `${APP_URL}/pricing`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.6 },
    ...indexableArticles.map((article) => ({
      url: `${APP_URL}/kien-thuc-tu-vi/${article.slug}`,
      lastModified: article.updatedAt || article.publishedAt || STATIC_LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
