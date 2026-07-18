"use client";

import { type ReactNode, useState } from "react";

export function SiteNavShell({ children }: { children: ReactNode }) {
  const [isClosing, setIsClosing] = useState(false);

  return (
    <nav
      className={`site-nav hidden items-center rounded-full border border-orange-100 bg-white/70 p-1 text-sm font-semibold text-stone-600 shadow-sm lg:flex${isClosing ? " is-closing" : ""}`}
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
