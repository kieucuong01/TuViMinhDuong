"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __lsthGoogleTagLoaded?: boolean;
  }
}

type GoogleAnalyticsDeferredLoaderProps = {
  tagId: string;
  measurementId?: string;
  adsId?: string;
};

function ensureGtagQueue() {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  return window.gtag;
}

export function GoogleAnalyticsDeferredLoader({
  tagId,
  measurementId,
  adsId,
}: GoogleAnalyticsDeferredLoaderProps) {
  useEffect(() => {
    const gtag = ensureGtagQueue();
    gtag("js", new Date());
    if (measurementId) {
      gtag("config", measurementId, { send_page_view: false });
    }
    if (adsId) {
      gtag("config", adsId);
    }

    let loaded = false;
    let timer: number | undefined;

    const loadGoogleTag = () => {
      if (loaded || window.__lsthGoogleTagLoaded) return;
      loaded = true;
      window.__lsthGoogleTagLoaded = true;
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tagId)}`;
      document.head.appendChild(script);
      cleanupInteractionListeners();
    };

    const schedule = () => {
      timer = window.setTimeout(loadGoogleTag, 12000);
    };

    const cleanupInteractionListeners = () => {
      document.removeEventListener("pointerdown", loadGoogleTag, true);
      document.removeEventListener("keydown", loadGoogleTag, true);
      document.removeEventListener("submit", loadGoogleTag, true);
    };

    document.addEventListener("pointerdown", loadGoogleTag, true);
    document.addEventListener("keydown", loadGoogleTag, true);
    document.addEventListener("submit", loadGoogleTag, true);
    schedule();

    return () => {
      if (timer) window.clearTimeout(timer);
      cleanupInteractionListeners();
    };
  }, [adsId, measurementId, tagId]);

  return null;
}
