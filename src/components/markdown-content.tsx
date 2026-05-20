import type React from "react";
import Image from "next/image";
import Link from "next/link";

function renderInline(text: string) {
  const parts: React.ReactNode[] = [];
  const linkPattern = /\[([^\]]+)]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(text))) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const label = match[1];
    const href = match[2];
    const isExternal = /^https?:\/\//.test(href);
    parts.push(
      isExternal ? (
        <a key={`${href}-${match.index}`} href={href} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      ) : (
        <Link key={`${href}-${match.index}`} href={href}>
          {label}
        </Link>
      ),
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export function MarkdownContent({ content }: { content: string }) {
  const blocks = content.trim().split(/\n{2,}/);
  const nodes: React.ReactNode[] = [];

  blocks.forEach((block, index) => {
    const text = block.trim();
    const image = text.match(/^!\[([^\]]*)]\(([^)]+)\)$/);
    if (image) {
      nodes.push(
        <figure key={index}>
          <Image src={image[2]} alt={image[1]} width={1200} height={675} sizes="(min-width: 768px) 768px, 100vw" />
          {image[1] ? <figcaption>{image[1]}</figcaption> : null}
        </figure>,
      );
      return;
    }

    if (text.startsWith("### ")) {
      nodes.push(<h3 key={index}>{renderInline(text.slice(4))}</h3>);
      return;
    }

    if (text.startsWith("## ")) {
      nodes.push(<h2 key={index}>{renderInline(text.slice(3))}</h2>);
      return;
    }

    if (/^- /m.test(text)) {
      nodes.push(
        <ul key={index}>
          {text
            .split("\n")
            .filter((item) => item.trim().startsWith("- "))
            .map((item) => (
              <li key={item}>{renderInline(item.trim().slice(2))}</li>
            ))}
        </ul>,
      );
      return;
    }

    nodes.push(<p key={index}>{renderInline(text.replace(/\n/g, " "))}</p>);
  });

  return <div className="prose-content mt-8">{nodes}</div>;
}
