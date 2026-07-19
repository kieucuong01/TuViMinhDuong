"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { GOOGLE_ADS_ID, GOOGLE_ADS_LABELS, GOOGLE_ANALYTICS_ID } from "@/lib/env";
import {
  GOOGLE_ADS_EVENT_VALUES,
  googleAdsSendTo,
  shouldTrackGoogleAdsConversion,
} from "@/lib/google-ads";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type AdEventPayload = Record<string, string | number | boolean | undefined>;
type PaymentStatusResponse = {
  verified?: boolean;
  status?: string;
  transactionId?: string;
  value?: number;
  currency?: string;
  packageKey?: string;
  coins?: number;
  chartId?: string;
  purchaseType?: string;
  readingId?: string;
};

const DEDUPE_PREFIX = "lsth-ad-event";
const CREATED_CHART_FLAG = "created=1";

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

function numberFrom(value?: string | null) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function numberFromUnknown(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value || 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function markTrackedOnce(key: string) {
  try {
    const storageKey = `${DEDUPE_PREFIX}:${key}`;
    if (window.localStorage.getItem(storageKey)) return false;
    window.localStorage.setItem(storageKey, new Date().toISOString());
  } catch {
    return true;
  }
  return true;
}

function sendGtagEvent(eventName: string, payload: AdEventPayload = {}) {
  const gtag = ensureGtagQueue();
  const value =
    typeof payload.value === "number"
      ? payload.value
      : shouldTrackGoogleAdsConversion(eventName)
        ? GOOGLE_ADS_EVENT_VALUES[eventName] || undefined
        : undefined;
  const currency = typeof payload.currency === "string" ? payload.currency : "VND";
  const eventPayload = {
    event_category: "ads_funnel",
    ...payload,
    ...(value ? { value } : {}),
    currency,
    send_to: GOOGLE_ANALYTICS_ID,
  };

  gtag("event", eventName, eventPayload);

  const conversionSendTo = googleAdsSendTo(GOOGLE_ADS_ID, GOOGLE_ADS_LABELS, eventName);
  if (!conversionSendTo) return;

  gtag("event", "conversion", {
    send_to: conversionSendTo,
    ...(value ? { value } : {}),
    currency,
    transaction_id: payload.transaction_id,
  });
}

function sendOnce(dedupeKey: string, eventName: string, payload: AdEventPayload = {}) {
  if (!markTrackedOnce(`${eventName}:${dedupeKey}`)) return;
  sendGtagEvent(eventName, payload);
}

export function GoogleAdsEventReporter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const chartId = pathname.startsWith("/la-so/") ? pathname.split("/")[2] : "";
    const controller = new AbortController();
    let cancelled = false;

    if (params.get("created") === "1" && chartId) {
      sendOnce(`${CREATED_CHART_FLAG}:${chartId}`, "create_chart", {
        chart_id: chartId,
        source: params.get("adSource") || "chart_form",
      });
    }

    const status = params.get("status");
    const orderCode = params.get("orderCode");

    if (status === "success" && orderCode) {
      fetch(`/api/payments/status?orderCode=${encodeURIComponent(orderCode)}`, {
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((paymentStatus: PaymentStatusResponse | null) => {
          if (cancelled || !paymentStatus?.verified) return;

          const transactionId = paymentStatus.transactionId || orderCode;
          sendOnce(`verified-orderCode:${transactionId}`, "purchase", {
            transaction_id: transactionId,
            payment_status: paymentStatus.status || status,
            package_key: paymentStatus.packageKey || params.get("adPackage") || undefined,
            value: numberFromUnknown(paymentStatus.value),
            currency: paymentStatus.currency || "VND",
            coins: paymentStatus.coins,
            chart_id: paymentStatus.chartId,
            purchase_type: paymentStatus.purchaseType,
            reading_id: paymentStatus.readingId,
          });
        })
        .catch(() => {
          // Purchase conversions must come from verified paid orders only.
        });
    }

    const readingId = params.get("reading");
    if (params.get("generating") === "1" && readingId) {
      sendOnce(`paid_reading_request:${readingId}`, "paid_reading_request", {
        chart_id: chartId || undefined,
        reading_id: readingId,
      });
    }

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    function onSubmit(event: SubmitEvent) {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      const eventName = form?.dataset.adEvent;
      if (!form || !eventName) return;
      sendGtagEvent(eventName, {
        placement: form.dataset.adPlacement,
        value: numberFrom(form.dataset.adValue),
        package_key: form.dataset.adPackage,
        chart_id: form.dataset.chartId || (pathname.startsWith("/la-so/") ? pathname.split("/")[2] : undefined),
      });
    }

    function onClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;
      const element = target?.closest<HTMLElement>("[data-ad-click]");
      const eventName = element?.dataset.adClick;
      if (!element || !eventName) return;
      sendGtagEvent(eventName, {
        placement: element.dataset.adPlacement,
        href: element instanceof HTMLAnchorElement ? element.href : undefined,
        chart_id: element.dataset.chartId || (pathname.startsWith("/la-so/") ? pathname.split("/")[2] : undefined),
      });
    }

    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("click", onClick, true);
    };
  }, [pathname]);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-ad-view]"));
    if (elements.length === 0) return;

    const report = (element: HTMLElement) => {
      const eventName = element.dataset.adView;
      if (!eventName) return;
      const chartId = element.dataset.chartId || (pathname.startsWith("/la-so/") ? pathname.split("/")[2] : "");
      const depth = numberFromUnknown(element.dataset.adDepth);
      sendOnce(`${pathname}:${chartId}:${depth || ""}`, eventName, {
        chart_id: chartId || undefined,
        depth,
      });
    };

    if (!("IntersectionObserver" in window)) {
      elements.forEach(report);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          report(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.35 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
