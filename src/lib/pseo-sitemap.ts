import { MAIN_STARS } from "@/lib/pseo-registry";

type SitemapPage = {
  slug: string;
  starSlug: string;
  updatedAt: Date;
};

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  })[character] || character);
}

export function buildPseoSitemapIndexXml(baseUrl: string) {
  const normalized = baseUrl.replace(/\/$/, "");
  const locations = [
    `${normalized}/sitemap.xml`,
    ...MAIN_STARS.map((star) => `${normalized}/tra-cuu/sitemap/${star.slug}`),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${locations.map((location) => `  <sitemap><loc>${escapeXml(location)}</loc></sitemap>`).join("\n")}
</sitemapindex>`;
}

export function buildPseoSitemapXml(baseUrl: string, starSlug: string, pages: SitemapPage[]) {
  const normalized = baseUrl.replace(/\/$/, "");
  const urls = pages.filter((page) => page.starSlug === starSlug);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((page) => `  <url>
    <loc>${escapeXml(`${normalized}/tra-cuu/${page.slug}`)}</loc>
    <lastmod>${page.updatedAt.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.65</priority>
  </url>`).join("\n")}
</urlset>`;
}
