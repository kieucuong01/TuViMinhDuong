export const FREE_OVERVIEW_GUEST_INSIGHT_DEPTH = 2;

export function buildFreeOverviewTeaser(content: string) {
  const thirdInsight = content.search(/^##\s+3\.\s+/mu);
  if (thirdInsight < 0) return "";
  return content.slice(0, thirdInsight).trim();
}
