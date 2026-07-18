"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
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
  }, [adsId, measurementId, tagId]);

  return (
    <Script
      id="lsth-google-tag"
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tagId)}`}
      strategy="afterInteractive"
    />
  );
}
