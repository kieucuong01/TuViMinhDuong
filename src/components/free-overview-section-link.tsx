"use client";

import type { ReactNode } from "react";

export function FreeOverviewSectionLink({ targetId, children, className }: {
  targetId: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a href={`#${targetId}`} className={className} onClick={() => {
      const section = document.getElementById(targetId);
      if (section instanceof HTMLDetailsElement) {
        section.open = true;
        section.querySelector("summary")?.focus({ preventScroll: true });
      }
    }}>
      {children}
    </a>
  );
}
