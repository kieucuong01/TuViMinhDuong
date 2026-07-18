"use client";

import { type ReactNode, useState } from "react";

export function SiteNavShell({ children }: { children: ReactNode }) {
  const [isClosing, setIsClosing] = useState(false);

  return (
    <nav
      className={isClosing ? "site-nav is-closing" : "site-nav"}
      onClickCapture={(event) => {
        if ((event.target as HTMLElement).closest("a")) setIsClosing(true);
      }}
      onMouseEnter={() => setIsClosing(false)}
      onMouseLeave={() => setIsClosing(false)}
    >
      {children}
    </nav>
  );
}
