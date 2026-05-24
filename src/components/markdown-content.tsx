import type React from "react";
import Image from "next/image";
import Link from "next/link";

type InlineToken =
  | { type: "text"; value: string }
  | { type: "strong"; value: string }
  | { type: "link"; label: string; href: string };

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

function headingId(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function MarkdownContent({ content }: { content: string }) {
  const nodes: React.ReactNode[] = [];
  const lines = content.trim().split(/\r?\n/);
  let index = 0;
  let nodeKey = 0;

  while (index < lines.length) {
    const text = lines[index].trim();
    if (!text) {
      index += 1;
      continue;
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
        <h1 key={nodeKey} id={headingId(title)}>
          {renderInline(title)}
        </h1>,
      );
      nodeKey += 1;
      index += 1;
      continue;
    }

    if (text.startsWith("### ")) {
      const title = text.slice(4);
      nodes.push(
        <h3 key={nodeKey} id={headingId(title)}>
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
        <h2 key={nodeKey} id={headingId(title)}>
          {renderInline(title)}
        </h2>,
      );
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

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const line = lines[index].trim();
      if (!line || line.startsWith("# ") || line.startsWith("## ") || line.startsWith("### ") || line.startsWith("- ") || /^!\[([^\]]*)]\(([^)]+)\)$/.test(line)) {
        break;
      }
      paragraphLines.push(line);
      index += 1;
    }
    nodes.push(<p key={nodeKey}>{renderInline(paragraphLines.join(" "))}</p>);
    nodeKey += 1;
  }

  return <div className="prose-content mt-8">{nodes}</div>;
}
