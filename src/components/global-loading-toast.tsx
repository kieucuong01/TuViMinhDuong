"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type LoadingKind = "route" | "form";
type LoadingState = { kind: LoadingKind; message?: string };

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
  const [loading, setLoading] = useState<LoadingState | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const latestUrlRef = useRef("");
  const activeControlsRef = useRef<HTMLElement[]>([]);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const clearActiveControls = useCallback(() => {
    for (const element of activeControlsRef.current) {
      element.classList.remove("is-loading");
      element.removeAttribute("aria-busy");

      if (element instanceof HTMLButtonElement && element.dataset.loadingDisabled === "true") {
        element.disabled = false;
        delete element.dataset.loadingDisabled;
      }
    }
    activeControlsRef.current = [];
  }, []);

  const show = useCallback(
    (nextKind: LoadingKind, message?: string) => {
      clearTimer();
      setLoading({ kind: nextKind, message });
      timeoutRef.current = window.setTimeout(
        () => {
          setLoading(null);
          clearActiveControls();
        },
        nextKind === "form" ? 14000 : 7000,
      );
    },
    [clearActiveControls, clearTimer],
  );

  const markFormLoading = useCallback(
    (form: HTMLFormElement, submitter: HTMLElement | null) => {
      clearActiveControls();
      form.setAttribute("aria-busy", "true");
      form.classList.add("is-loading");
      activeControlsRef.current.push(form);

      const button = submitter?.closest("button") as HTMLButtonElement | null;
      if (!button) return;

      button.classList.add("is-loading");
      button.setAttribute("aria-busy", "true");
      if (!button.disabled) {
        button.disabled = true;
        button.dataset.loadingDisabled = "true";
      }

      activeControlsRef.current.push(button);
    },
    [clearActiveControls],
  );

  useEffect(() => {
    const currentUrl = `${pathname}?${searchParams.toString()}`;
    if (latestUrlRef.current && latestUrlRef.current !== currentUrl) {
      window.setTimeout(() => {
        setLoading(null);
        clearActiveControls();
      }, 180);
    }
    latestUrlRef.current = currentUrl;
  }, [clearActiveControls, pathname, searchParams]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target || anchor.hasAttribute("download") || anchor.dataset.noLoadingToast === "true") return;
      if (!isInternalUrl(anchor.href) || isSameHashNavigation(anchor.href)) return;
      if (anchor.href === window.location.href) return;
      show("route", anchor.dataset.loadingMessage);
    }

    function onSubmit(event: SubmitEvent) {
      const form = event.target as HTMLFormElement | null;
      if (!form || form.dataset.noLoadingToast === "true") return;
      const submitter = event.submitter instanceof HTMLElement ? event.submitter : null;

      window.setTimeout(() => {
        if (event.defaultPrevented) return;
        markFormLoading(form, submitter);
        show("form", form.dataset.loadingMessage);
      }, 0);
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      clearTimer();
      clearActiveControls();
    };
  }, [clearActiveControls, clearTimer, markFormLoading, show]);

  if (!loading) return null;

  return (
    <div className="global-loading-toast" role="status" aria-live="polite" aria-atomic="true">
      <span className="global-loading-spinner" aria-hidden="true" />
      <span>{loading.message || messages[loading.kind]}</span>
      <i aria-hidden="true" />
    </div>
  );
}
