import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/admin/", "/api", "/api/"] }],
    sitemap: [`${APP_URL}/sitemap.xml`, `${APP_URL}/sitemap-index.xml`],
  };
}
