export const FREE_OVERVIEW_TEASER_MAX_WORDS = 500;

function limitMarkdownWords(content: string, limit: number) {
  let remaining = limit;
  const output: string[] = [];

  for (const line of content.trim().split(/\r?\n/)) {
    if (remaining <= 0) break;
    const words = line.trim().split(/\s+/).filter(Boolean);
    if (words.length <= remaining) {
      output.push(line);
      remaining -= words.length;
      continue;
    }
    output.push(words.slice(0, remaining).join(" "));
    remaining = 0;
  }

  return output.join("\n").trim();
}

function removeTemplateHeading(content: string) {
  return content
    .split(/\r?\n/)
    .filter((line, index) => index !== 0 || !/^#{1,6}\s*Tổng quan miễn phí\s*$/i.test(line.trim()))
    .join("\n")
    .trimStart();
}

export function buildFreeOverviewTeaser(content: string) {
  return limitMarkdownWords(removeTemplateHeading(content), FREE_OVERVIEW_TEASER_MAX_WORDS);
}
