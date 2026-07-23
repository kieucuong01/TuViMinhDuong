export const FREE_OVERVIEW_GUEST_INSIGHT_DEPTH = 2;

export function countVisibleMarkdownWords(content: string) {
  const visibleText = content
    .replace(/!\[([^\]]*)\]\([^)]+\)/gu, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/gu, "$1")
    .replace(/^\s{0,3}(?:#{1,6}|[-+*]|\d+\.)\s+/gmu, "")
    .replace(/[*_~\x60>|]/gu, " ");
  return visibleText.trim().split(/\s+/u).filter(Boolean).length;
}

export function buildFreeOverviewTeaser(content: string) {
  const premiumHookCount = content.match(/🔒\s*Nâng cấp Premium để xem:/gu)?.length || 0;
  if (premiumHookCount >= 4) {
    return content.trim();
  }

  const thirdInsight = content.search(/^##\s+3\.\s+/mu);
  if (thirdInsight < 0) return "";
  return content.slice(0, thirdInsight).trim();
}
