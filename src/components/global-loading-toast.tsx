"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type LoadingKind = "route" | "form";

const messages: Record<LoadingKind, string> = {
  route: "Đang mở trang...",
  form: "Đang xử lý yêu cầu...",
};

function isInternalUrl(href: string) {
  try {
    const url = new URL(href, window.location.href);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

function isSameHashNavigation(href: string) {
  const url = new URL(href, window.location.href);
  return url.pathname === window.location.pathname && url.search === window.location.search && Boolean(url.hash);
}

export function GlobalLoadingToast() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [kind, setKind] = useState<LoadingKind | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const latestUrlRef = useRef("");

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const show = useCallback((nextKind: LoadingKind) => {
    clearTimer();
    setKind(nextKind);
    timeoutRef.current = window.setTimeout(() => setKind(null), nextKind === "form" ? 14000 : 7000);
  }, [clearTimer]);

  useEffect(() => {
    const currentUrl = `${pathname}?${searchParams.toString()}`;
    if (latestUrlRef.current && latestUrlRef.current !== currentUrl) {
      window.setTimeout(() => setKind(null), 180);
    }
    latestUrlRef.current = currentUrl;
  }, [pathname, searchParams]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target || anchor.hasAttribute("download") || anchor.dataset.noLoadingToast === "true") return;
      if (!isInternalUrl(anchor.href) || isSameHashNavigation(anchor.href)) return;
      if (anchor.href === window.location.href) return;
      show("route");
    }

    function onSubmit(event: SubmitEvent) {
      const form = event.target as HTMLFormElement | null;
      if (!form || form.dataset.noLoadingToast === "true") return;
      window.setTimeout(() => {
        if (event.defaultPrevented) return;
        if ((form.method || "get").toLowerCase() === "post") show("form");
      }, 0);
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit);
      clearTimer();
    };
  }, [clearTimer, show]);

  if (!kind) return null;

  return (
    <div className="global-loading-toast" role="status" aria-live="polite" aria-atomic="true">
      <span className="global-loading-spinner" aria-hidden="true" />
      <span>{messages[kind]}</span>
      <i aria-hidden="true" />
    </div>
  );
}
