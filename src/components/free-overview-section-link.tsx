"use client";

import type { ReactNode } from "react";

export function FreeOverviewSectionLink({ targetId, children, className }: {
  targetId: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a href={`#${targetId}`} className={className} onClick={event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const section = document.getElementById(targetId);
      if (section instanceof HTMLDetailsElement) {
        event.preventDefault();
        section.open = true;
        if (location.hash !== `#${targetId}`) history.pushState(null, "", `#${targetId}`);
        section.scrollIntoView({ block: "start" });
        section.querySelector("summary")?.focus({ preventScroll: true });
      }
    }}>
      {children}
    </a>
  );
}
