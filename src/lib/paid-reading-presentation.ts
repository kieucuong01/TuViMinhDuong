export type PaidReadingDisplayChapter = {
  key: string;
  id: string;
  title: string;
  index: number;
};

export type NormalizedPaidReading = {
  content: string;
  chapters: PaidReadingDisplayChapter[];
};

const DATA_DASHBOARD_KEY = "trung-tam-du-lieu-la-so";
const ACTION_GUIDE_KEY = "cam-nang-hanh-dong";
const ACTION_PLAN_TITLE = "Kế hoạch hành động cá nhân";
const ACTION_PLAN_KEY = "ke-hoach-hanh-dong-ca-nhan";
const ANCHOR_KEY = "mo-neo";

export function paidReadingHeadingId(text: string) {
  return text
    .replace(/\*\*/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "section";
}

type ParsedChapter = {
  title: string;
  body: string[];
};

function splitH1Chapters(content: string) {
  const lines = content.replace(/\r\n?/g, "\n").trim().split("\n");
  const preamble: string[] = [];
  const chapters: ParsedChapter[] = [];
  let current: ParsedChapter | null = null;

  for (const line of lines) {
    const heading = line.match(/^# (.+)$/);
    if (heading) {
      current = { title: heading[1].trim(), body: [] };
      chapters.push(current);
    } else if (current) {
      current.body.push(line);
    } else {
      preamble.push(line);
    }
  }

  return { preamble, chapters };
}

function extractSection(lines: string[], sectionKey: string) {
  const start = lines.findIndex((line) => {
    const match = line.match(/^## (.+)$/);
    return Boolean(match && paidReadingHeadingId(match[1]) === sectionKey);
  });
  if (start < 0) return { remaining: lines, content: [] as string[] };

  let end = start + 1;
  while (end < lines.length && !/^## (.+)$/.test(lines[end])) end += 1;

  return {
    remaining: [...lines.slice(0, start), ...lines.slice(end)],
    content: lines.slice(start + 1, end).filter((line, index, section) => {
      if (line.trim()) return true;
      return index > 0 && index < section.length - 1;
    }),
  };
}

function emphasizeAnchor(lines: string[]) {
  const start = lines.findIndex((line) => {
    const match = line.match(/^## (.+)$/);
    return Boolean(match && paidReadingHeadingId(match[1]) === ANCHOR_KEY);
  });
  if (start < 0) return lines;

  let end = start + 1;
  while (end < lines.length && !/^## (.+)$/.test(lines[end])) end += 1;
  if (lines.slice(start + 1, end).some((line) => line.includes("**"))) return lines;

  const target = lines.findIndex((line, index) => {
    if (index <= start || index >= end) return false;
    const trimmed = line.trim();
    return Boolean(trimmed && !/^[-|#]/.test(trimmed) && !/^\d+\.\s/.test(trimmed));
  });
  if (target < 0) return lines;

  const sentence = lines[target].match(/^(.+?[.!?])(?:\s+(.*))?$/);
  const emphasized = sentence
    ? `**${sentence[1]}**${sentence[2] ? ` ${sentence[2]}` : ""}`
    : `**${lines[target].trim()}**`;
  const result = [...lines];
  result[target] = emphasized;
  return result;
}

function renderChapter(chapter: ParsedChapter) {
  const body = chapter.body.join("\n").trim();
  return body ? `# ${chapter.title}\n${body}` : `# ${chapter.title}`;
}

export function normalizePaidReading(content: string): NormalizedPaidReading {
  const { preamble, chapters } = splitH1Chapters(content);
  const actions: Array<{ title: string; content: string[] }> = [];
  const kept: ParsedChapter[] = [];

  for (const chapter of chapters) {
    const chapterKey = paidReadingHeadingId(chapter.title);
    if (chapterKey === DATA_DASHBOARD_KEY) continue;

    const extracted = extractSection(chapter.body, ACTION_GUIDE_KEY);
    if (extracted.content.some((line) => line.trim())) {
      actions.push({ title: chapter.title, content: extracted.content });
    }
    kept.push({
      title: chapter.title,
      body: emphasizeAnchor(extracted.remaining),
    });
  }

  const hasActionPlan = kept.some((chapter) => paidReadingHeadingId(chapter.title) === ACTION_PLAN_KEY);
  if (actions.length > 0 && !hasActionPlan) {
    const body = actions.flatMap((action, index) => [
      ...(index === 0 ? [] : [""]),
      `## ${action.title}`,
      ...action.content,
    ]);
    kept.push({ title: ACTION_PLAN_TITLE, body });
  }

  const rendered = [
    preamble.join("\n").trim(),
    ...kept.map(renderChapter),
  ].filter(Boolean).join("\n\n");

  return {
    content: rendered,
    chapters: kept.map((chapter, index) => {
      const id = paidReadingHeadingId(chapter.title);
      return {
        key: id,
        id,
        title: chapter.title.replace(/\*\*/g, ""),
        index,
      };
    }),
  };
}
