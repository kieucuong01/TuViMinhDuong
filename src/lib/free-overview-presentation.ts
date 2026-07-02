export const FREE_OVERVIEW_TEASER_MAX_WORDS = 500;

function extractMarkdownSection(content: string, heading: string | RegExp) {
  const lines = content.split(/\r?\n/);
  const startIndex = lines.findIndex((line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("## ")) return false;
    const headingText = trimmed.replace(/^##\s+/, "");
    return typeof heading === "string"
      ? headingText.toLocaleLowerCase("vi") === heading.toLocaleLowerCase("vi")
      : heading.test(headingText);
  });
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
  const sections: Array<[string, string | RegExp, number]> = [
    ["Mỏ neo", "Mỏ neo", 120],
    ["Điểm đáng chú ý nhất", "Điểm đáng chú ý nhất", 135],
    ["Khí chất và nội lực", "Khí chất và nội lực", 90],
    ["Công việc và tài chính", "Công việc và tài chính", 85],
    ["Tình cảm và quan hệ", "Tình cảm và quan hệ", 55],
    ["Vận năm", /^Vận năm\b/i, 55],
  ];
  const actions = extractMarkdownSection(content, "Cẩm nang hành động");
  const firstAction = actions.split(/\r?\n/).find((line) => /^\s*[-*]\s+\S/.test(line)) || "";
  const projected = [
    ...sections.map(([label, heading, limit]) => {
      const section = limitMarkdownWords(extractMarkdownSection(content, heading), limit);
      return section ? `## ${label}\n${section}` : "";
    }),
    firstAction ? `## Một hành động nên làm ngay\n${limitMarkdownWords(firstAction, 35)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return limitMarkdownWords(projected || content, FREE_OVERVIEW_TEASER_MAX_WORDS);
}
