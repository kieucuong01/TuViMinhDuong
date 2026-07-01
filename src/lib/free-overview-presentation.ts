export const FREE_OVERVIEW_TEASER_MAX_WORDS = 250;

function extractMarkdownSection(content: string, heading: string) {
  const lines = content.split(/\r?\n/);
  const expected = `## ${heading}`.toLocaleLowerCase("vi");
  const startIndex = lines.findIndex((line) => line.trim().toLocaleLowerCase("vi") === expected);
  if (startIndex < 0) return "";

  const sectionLines: string[] = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (/^##\s+\S/.test(lines[index].trim())) break;
    sectionLines.push(lines[index]);
  }
  return sectionLines.join("\n").trim();
}

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
    output.push(`${words.slice(0, remaining).join(" ")}…`);
    remaining = 0;
  }

  return output.join("\n").trim();
}

export function buildFreeOverviewTeaser(content: string) {
  const anchor = limitMarkdownWords(extractMarkdownSection(content, "Mỏ neo"), 90);
  const highlight = limitMarkdownWords(extractMarkdownSection(content, "Điểm đáng chú ý nhất"), 100);
  const actions = extractMarkdownSection(content, "Cẩm nang hành động");
  const firstAction = actions.split(/\r?\n/).find((line) => /^\s*[-*]\s+\S/.test(line)) || "";
  const projected = [
    anchor ? `## Mỏ neo\n${anchor}` : "",
    highlight ? `## Điểm đáng chú ý nhất\n${highlight}` : "",
    firstAction ? `## Một hành động nên làm ngay\n${limitMarkdownWords(firstAction, 25)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return limitMarkdownWords(projected || content, FREE_OVERVIEW_TEASER_MAX_WORDS);
}
