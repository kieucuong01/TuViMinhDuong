export const FREE_OVERVIEW_GUEST_TEASER_MIN_CHARS = 650;
export const FREE_OVERVIEW_GUEST_TEASER_MAX_CHARS = 900;
export const FREE_OVERVIEW_FALLBACK_TEASER_MAX_CHARS = 800;
export const FREE_OVERVIEW_GUEST_TEASER_HEADING = "Tín hiệu nổi bật của lá số";

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

function limitTextCharacters(content: string, maxCharacters: number, preferredMinimum = 0) {
  const trimmed = content.trim();
  if (trimmed.length <= maxCharacters) return trimmed;

  const slice = trimmed.slice(0, maxCharacters);
  const sentenceBoundary = Math.max(
    slice.lastIndexOf("."),
    slice.lastIndexOf("!"),
    slice.lastIndexOf("?"),
    slice.lastIndexOf("。"),
    slice.lastIndexOf("\n\n"),
  );
  if (sentenceBoundary >= preferredMinimum) return slice.slice(0, sentenceBoundary + 1).trim();

  const wordBoundary = slice.lastIndexOf(" ");
  if (wordBoundary >= preferredMinimum) return slice.slice(0, wordBoundary).trim();

  return slice.trim();
}

function removeTemplateHeading(content: string) {
  return content
    .split(/\r?\n/)
    .filter((line, index) => index !== 0 || !/^#{1,6}\s*Tổng quan miễn phí\s*$/i.test(line.trim()))
    .join("\n")
    .trimStart();
}

export function buildFreeOverviewTeaser(content: string) {
  const dedicatedTeaser = extractMarkdownSection(content, FREE_OVERVIEW_GUEST_TEASER_HEADING);
  if (dedicatedTeaser) {
    return limitTextCharacters(
      dedicatedTeaser,
      FREE_OVERVIEW_GUEST_TEASER_MAX_CHARS,
      FREE_OVERVIEW_GUEST_TEASER_MIN_CHARS,
    );
  }

  return limitTextCharacters(removeTemplateHeading(content), FREE_OVERVIEW_FALLBACK_TEASER_MAX_CHARS);
}
