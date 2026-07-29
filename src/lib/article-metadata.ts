const TRAILING_SITE_BRAND = /(?:\s*\|\s*Lá số tinh hoa)+\s*$/giu;

export function normalizeArticleMetadataTitle(value: string) {
  return value.replace(TRAILING_SITE_BRAND, "").trim();
}
