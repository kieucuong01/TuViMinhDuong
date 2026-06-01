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

const DEDUPE_PREFIX = "lsth-ad-event";
const CREATED_CHART_FLAG = "created=1";

function numberFrom(value?: string | null) {
  const parsed = Number(value || 0);
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

  window.gtag?.("event", eventName, eventPayload);

  const conversionSendTo = googleAdsSendTo(GOOGLE_ADS_ID, GOOGLE_ADS_LABELS, eventName);
  if (!conversionSendTo) return;

  window.gtag?.("event", "conversion", {
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

    if (params.get("created") === "1" && chartId) {
      sendOnce(`${CREATED_CHART_FLAG}:${chartId}`, "create_chart", {
        chart_id: chartId,
        source: params.get("adSource") || "chart_form",
      });
    }

    const status = params.get("status");
    const orderCode = params.get("orderCode");
    if ((status === "success" || status === "demo-paid") && orderCode) {
      sendOnce(`orderCode:${orderCode}`, "purchase", {
        transaction_id: orderCode,
        payment_status: status,
        package_key: params.get("adPackage") || undefined,
        value: numberFrom(params.get("adValue")),
      });
    }

    const readingId = params.get("reading");
    if (params.get("generating") === "1" && readingId) {
      sendOnce(`paid_reading_request:${readingId}`, "paid_reading_request", {
        chart_id: chartId || undefined,
        reading_id: readingId,
      });
    }
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
      });
    }

    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return null;
}
