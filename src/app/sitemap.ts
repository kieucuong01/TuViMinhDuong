import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/env";
import { listArticles } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await listArticles();
  return [
    { url: APP_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${APP_URL}/kien-thuc-tu-vi`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${APP_URL}/xem-ngay`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${APP_URL}/pricing`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${APP_URL}/nap-xu`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    ...articles.map((article) => ({
      url: `${APP_URL}/kien-thuc-tu-vi/${article.slug}`,
      lastModified: article.updatedAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
