export const LIFETIME_TUVI_PREFIX = "tu-vi-tron-doi-tuoi-";

export function isLifetimeTuViSlug(slug: string) {
  return slug.startsWith(LIFETIME_TUVI_PREFIX);
}

export function articlePath(article: { slug: string; canonicalUrl?: string | null }) {
  const canonical = article.canonicalUrl?.trim();
  if (canonical?.startsWith("/")) return canonical;
  return `/kien-thuc-tu-vi/${article.slug}`;
}
