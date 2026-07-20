import type React from "react";
import Image from "next/image";
import Link from "next/link";

type InlineToken =
  | { type: "text"; value: string }
  | { type: "strong"; value: string }
  | { type: "link"; label: string; href: string };

export type MarkdownHeading = {
  id: string;
  title: string;
};

const READING_BLOCK_BY_TITLE = {
  "Đọc nhanh": "quick",
  "Điểm nổi bật": "highlight",
  "Lợi thế": "strength",
  "Điểm cần lưu ý": "caution",
  "Gợi ý thực tế": "action",
  "Vì sao có nhận định này": "evidence",
} as const;

export function parseInlineMarkdown(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const inlinePattern = /(\*\*([^*]+)\*\*)|\[([^\]]+)]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlinePattern.exec(text))) {
    if (match.index > lastIndex) tokens.push({ type: "text", value: text.slice(lastIndex, match.index) });
    if (match[2]) tokens.push({ type: "strong", value: match[2] });
    else tokens.push({ type: "link", label: match[3], href: match[4] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) tokens.push({ type: "text", value: text.slice(lastIndex) });
  return tokens;
}

function renderInline(text: string) {
  return parseInlineMarkdown(text).map((token, index) => {
    if (token.type === "text") return token.value;
    if (token.type === "strong") return <strong key={`strong-${index}`}>{token.value}</strong>;

    const isExternal = /^https?:\/\//.test(token.href);
    return isExternal ? (
      <a key={`${token.href}-${index}`} href={token.href} target="_blank" rel="noopener noreferrer">
        {token.label}
      </a>
    ) : (
      <Link key={`${token.href}-${index}`} href={token.href}>
        {token.label}
      </Link>
    );
  });
}

function plainInlineText(text: string) {
  return parseInlineMarkdown(text).map((token) => {
    if (token.type === "link") return token.label;
    return token.value;
  }).join("");
}

function isTableSeparator(line: string) {
  return /^\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?$/.test(line);
}

function parseTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function baseHeadingId(text: string) {
  return text
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "section";
}

function uniqueHeadingId(title: string, seen: Map<string, number>) {
  const base = baseHeadingId(plainInlineText(title));
  const next = (seen.get(base) || 0) + 1;
  seen.set(base, next);
  return next === 1 ? base : `${base}-${next}`;
}

export function extractMarkdownHeadings(content: string): MarkdownHeading[] {
  const seen = new Map<string, number>();
  return content
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("## "))
    .map((line) => {
      const title = plainInlineText(line.slice(3)).trim();
      return {
        id: uniqueHeadingId(title, seen),
        title,
      };
    });
}

type MarkdownContentProps = {
  content: string;
  afterFirstSection?: React.ReactNode;
};

export function MarkdownContent({ content, afterFirstSection }: MarkdownContentProps) {
  const nodes: React.ReactNode[] = [];
  const lines = content.trim().split(/\r?\n/);
  const headingIds = new Map<number, Map<string, number>>();
  let index = 0;
  let nodeKey = 0;
  let sawFirstH2 = false;
  let insertedAfterFirstSection = false;

  function headingId(title: string, level: number) {
    const seen = headingIds.get(level) || new Map<string, number>();
    headingIds.set(level, seen);
    return uniqueHeadingId(title, seen);
  }

  function insertAfterFirstSection() {
    if (!afterFirstSection || insertedAfterFirstSection) return;
    nodes.push(
      <div key={`mid-article-${nodeKey}`} className="prose-mid-article-slot">
        {afterFirstSection}
      </div>,
    );
    nodeKey += 1;
    insertedAfterFirstSection = true;
  }

  while (index < lines.length) {
    const text = lines[index].trim();
    if (!text) {
      index += 1;
      continue;
    }

    if (sawFirstH2 && text.startsWith("## ")) {
      insertAfterFirstSection();
    }

    const image = text.match(/^!\[([^\]]*)]\(([^)]+)\)$/);
    if (image) {
      nodes.push(
        <figure key={nodeKey}>
          <Image src={image[2]} alt={image[1]} width={1200} height={675} sizes="(min-width: 768px) 768px, 100vw" />
          {image[1] ? <figcaption>{image[1]}</figcaption> : null}
        </figure>,
      );
      nodeKey += 1;
      index += 1;
      continue;
    }

    if (text.startsWith("# ")) {
      const title = text.slice(2);
      nodes.push(
        <h1 key={nodeKey} id={headingId(title, 1)}>
          {renderInline(title)}
        </h1>,
      );
      nodeKey += 1;
      index += 1;
      continue;
    }

    if (text.startsWith("### ")) {
      const title = text.slice(4);
      const readingBlock = READING_BLOCK_BY_TITLE[title as keyof typeof READING_BLOCK_BY_TITLE];
      nodes.push(
        <h3 key={nodeKey} id={headingId(title, 3)} {...(readingBlock ? { "data-reading-block": readingBlock } : {})}>
          {renderInline(title)}
        </h3>,
      );
      nodeKey += 1;
      index += 1;
      continue;
    }

    if (text.startsWith("## ")) {
      const title = text.slice(3);
      nodes.push(
        <h2 key={nodeKey} id={headingId(title, 2)}>
          {renderInline(title)}
        </h2>,
      );
      sawFirstH2 = true;
      nodeKey += 1;
      index += 1;
      continue;
    }

    if (text.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().slice(2));
        index += 1;
      }
      nodes.push(
        <ul key={nodeKey}>
          {items.map((item) => (
            <li key={item}>{renderInline(item)}</li>
          ))}
        </ul>,
      );
      nodeKey += 1;
      continue;
    }

    if (/^\d+\.\s+/.test(text)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      nodes.push(
        <ol key={nodeKey}>
          {items.map((item) => (
            <li key={item}>{renderInline(item)}</li>
          ))}
        </ol>,
      );
      nodeKey += 1;
      continue;
    }

    if (text.includes("|") && index + 1 < lines.length && isTableSeparator(lines[index + 1].trim())) {
      const headers = parseTableRow(text);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length) {
        const row = lines[index].trim();
        if (!row || !row.includes("|") || row.startsWith("#") || row.startsWith("- ") || /^\d+\.\s+/.test(row)) {
          break;
        }
        rows.push(parseTableRow(row));
        index += 1;
      }
      nodes.push(
        <div key={nodeKey} className="prose-table-wrap">
          <table>
            <thead>
              <tr>
                {headers.map((header, headerIndex) => (
                  <th key={`${header}-${headerIndex}`} scope="col">
                    {renderInline(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`${rowIndex}-${row.join("|")}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${rowIndex}-${cellIndex}`}>{renderInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      nodeKey += 1;
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const line = lines[index].trim();
      if (
        !line ||
        line.startsWith("# ") ||
        line.startsWith("## ") ||
        line.startsWith("### ") ||
        line.startsWith("- ") ||
        /^\d+\.\s+/.test(line) ||
        /^!\[([^\]]*)]\(([^)]+)\)$/.test(line) ||
        (line.includes("|") && index + 1 < lines.length && isTableSeparator(lines[index + 1].trim()))
      ) {
        break;
      }
      paragraphLines.push(line);
      index += 1;
    }
    nodes.push(<p key={nodeKey}>{renderInline(paragraphLines.join(" "))}</p>);
    nodeKey += 1;
  }

  if (sawFirstH2) {
    insertAfterFirstSection();
  }

  return <div className="prose-content mt-8">{nodes}</div>;
}
