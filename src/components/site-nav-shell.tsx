"use client";

import { type ReactNode, useState } from "react";

export function SiteNavShell({ children }: { children: ReactNode }) {
  const [isClosing, setIsClosing] = useState(false);
  const closeForLinkTarget = (target: EventTarget | null) => {
    if ((target as HTMLElement | null)?.closest("a")) setIsClosing(true);
  };

  return (
    <nav
      className={isClosing ? "site-nav is-closing" : "site-nav"}
      onPointerDownCapture={(event) => closeForLinkTarget(event.target)}
      onClickCapture={(event) => closeForLinkTarget(event.target)}
      onMouseEnter={() => setIsClosing(false)}
      onMouseLeave={() => setIsClosing(false)}
    >
      {children}
    </nav>
  );
}
