export const LIFETIME_TUVI_PREFIX = "tu-vi-tron-doi-tuoi-";
export const LIFETIME_TUVI_SECTION_PATH = "/xem-tu-vi-tron-doi";

export function isLifetimeTuViSlug(slug: string) {
  return slug.startsWith(LIFETIME_TUVI_PREFIX);
}

export function lifetimeTuViArticlePath(slug: string) {
  return `${LIFETIME_TUVI_SECTION_PATH}/${slug}`;
}

export function articlePath(article: { slug: string; canonicalUrl?: string | null }) {
  if (isLifetimeTuViSlug(article.slug)) return lifetimeTuViArticlePath(article.slug);
  const canonical = article.canonicalUrl?.trim();
  if (canonical?.startsWith("/")) return canonical;
  return `/kien-thuc-tu-vi/${article.slug}`;
}
