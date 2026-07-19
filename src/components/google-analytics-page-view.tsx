"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type GoogleAnalyticsPageViewProps = {
  measurementId: string;
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

export function GoogleAnalyticsPageView({ measurementId }: GoogleAnalyticsPageViewProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    const query = searchParams.toString();
    const pagePath = `${pathname}${query ? `?${query}` : ""}`;
    if (previousPath.current === pagePath) return;
    previousPath.current = pagePath;

    const gtag = ensureGtagQueue();
    gtag("event", "page_view", {
      page_title: document.title,
      page_location: window.location.href,
      page_path: pagePath,
      send_to: measurementId,
    });
  }, [measurementId, pathname, searchParams]);

  return null;
}
