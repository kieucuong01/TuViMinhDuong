export const FREE_OVERVIEW_GUEST_INSIGHT_DEPTH = 4;

export function countVisibleMarkdownWords(content: string) {
  const visibleText = content
    .replace(/!\[([^\]]*)\]\([^)]+\)/gu, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/gu, "$1")
    .replace(/^\s{0,3}(?:#{1,6}|[-+*]|\d+\.)\s+/gmu, "")
    .replace(/[*_~\x60>|]/gu, " ");
  return visibleText.trim().split(/\s+/u).filter(Boolean).length;
}

export function buildFreeOverviewTeaser(content: string) {
  return content.trim().replace(/\n{3,}/gu, "\n\n");
}
