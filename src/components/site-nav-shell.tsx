"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

let keepFlyoutsClosedUntilPointerLeaves = false;
const CLOSE_FLYOUTS_STORAGE_KEY = "site-nav-close-flyouts-until-pointer-leaves";
const FLYOUT_PANEL_SELECTOR = ".site-date-panel, .site-lookup-panel";

const shouldKeepFlyoutsClosed = () => {
  if (keepFlyoutsClosedUntilPointerLeaves) return true;
  if (typeof window === "undefined") return false;

  return window.sessionStorage.getItem(CLOSE_FLYOUTS_STORAGE_KEY) === "1";
};

const setKeepFlyoutsClosed = (value: boolean) => {
  keepFlyoutsClosedUntilPointerLeaves = value;

  if (typeof window === "undefined") return;
  if (value) {
    window.sessionStorage.setItem(CLOSE_FLYOUTS_STORAGE_KEY, "1");
  } else {
    window.sessionStorage.removeItem(CLOSE_FLYOUTS_STORAGE_KEY);
  }
};

const setFlyoutPanelsClosed = (nav: HTMLElement, closed: boolean) => {
  nav.querySelectorAll<HTMLElement>(FLYOUT_PANEL_SELECTOR).forEach((panel) => {
    if (closed) {
      panel.style.opacity = "0";
      panel.style.pointerEvents = "none";
      panel.style.visibility = "hidden";
      return;
    }

    panel.style.removeProperty("opacity");
    panel.style.removeProperty("pointer-events");
    panel.style.removeProperty("visibility");
  });
};

const getLinkFromTarget = (target: EventTarget | null) => (target as HTMLElement | null)?.closest("a") ?? null;
const isFlyoutPanelLink = (link: HTMLElement) => Boolean(link.closest(FLYOUT_PANEL_SELECTOR));

export function SiteNavShell({ children }: { children: ReactNode }) {
  const navRef = useRef<HTMLElement>(null);
  const [isClosing, setIsClosing] = useState(shouldKeepFlyoutsClosed);

  useEffect(() => {
    if (!navRef.current) return;
    setFlyoutPanelsClosed(navRef.current, isClosing);
  }, [isClosing]);

  const rememberPointerLinkTarget = (target: EventTarget | null) => {
    const link = getLinkFromTarget(target);
    if (link && isFlyoutPanelLink(link)) setKeepFlyoutsClosed(true);
  };

  const closeForLinkTarget = (target: EventTarget | null) => {
    const link = getLinkFromTarget(target);
    if (!link) return;

    setIsClosing(true);
  };

  const clearClosing = () => {
    setKeepFlyoutsClosed(false);
    setIsClosing(false);
  };

  return (
    <nav
      ref={navRef}
      className={isClosing ? "site-nav is-closing" : "site-nav"}
      onPointerDownCapture={(event) => rememberPointerLinkTarget(event.target)}
      onClickCapture={(event) => closeForLinkTarget(event.target)}
      onFocusCapture={(event) => {
        const target = event.target as HTMLElement | null;
        if (target?.closest("a") && !target.closest(FLYOUT_PANEL_SELECTOR) && !shouldKeepFlyoutsClosed()) {
          setIsClosing(false);
        }
      }}
      onMouseEnter={() => {
        if (!shouldKeepFlyoutsClosed()) setIsClosing(false);
      }}
      onMouseLeave={clearClosing}
    >
      {children}
    </nav>
  );
}
