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
    function gtag() {
      // eslint-disable-next-line prefer-rest-params -- gtag.js requires an Arguments object, not a rest-parameter array.
      window.dataLayer?.push(arguments);
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
      gtag("config", measurementId);
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
