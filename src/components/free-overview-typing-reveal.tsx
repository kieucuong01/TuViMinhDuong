"use client";

import { useEffect, useState } from "react";
import { MarkdownContent } from "@/components/markdown-content";

const INITIAL_VISIBLE_CHARS = 520;
const CHARS_PER_TICK = 34;
const TICK_MS = 70;

export function FreeOverviewTypingReveal({ content, enabled }: { content: string; enabled: boolean }) {
  const [visibleLength, setVisibleLength] = useState(() =>
    enabled ? Math.min(content.length, INITIAL_VISIBLE_CHARS) : content.length,
  );

  useEffect(() => {
    if (!enabled) return;
    const intervalId = setInterval(() => {
      setVisibleLength((current) => {
        const next = Math.min(content.length, current + CHARS_PER_TICK);
        if (next >= content.length) clearInterval(intervalId);
        return next;
      });
    }, TICK_MS);

    return () => clearInterval(intervalId);
  }, [content, enabled]);

  const visibleContent = enabled ? content.slice(0, visibleLength) : content;

  return (
    <div className="free-overview-typing-reveal" aria-live="off">
      <MarkdownContent content={visibleContent} />
      {enabled && visibleLength < content.length ? (
        <span className="free-overview-writing-cursor free-overview-typing-cursor" aria-hidden="true" />
      ) : null}
    </div>
  );
}
