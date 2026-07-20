import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const reporterSource = readFileSync(fileURLToPath(new URL("./google-ads-event-reporter.tsx", import.meta.url)), "utf8");
const analyticsSource = readFileSync(fileURLToPath(new URL("./google-analytics.tsx", import.meta.url)), "utf8");
const deferredLoaderSource = readFileSync(
  fileURLToPath(new URL("./google-analytics-deferred-loader.tsx", import.meta.url)),
  "utf8",
);
const chartFormSource = readFileSync(fileURLToPath(new URL("./chart-form.tsx", import.meta.url)), "utf8");
const coinTopupSource = readFileSync(fileURLToPath(new URL("./coin-topup-modal.tsx", import.meta.url)), "utf8");
const topupPageSource = readFileSync(fileURLToPath(new URL("../app/nap-xu/page.tsx", import.meta.url)), "utf8");
const quickReadingSource = readFileSync(fileURLToPath(new URL("./quick-reading-form.tsx", import.meta.url)), "utf8");
const fullReadingJobPanelSource = readFileSync(
  fileURLToPath(new URL("./full-reading-job-panel.tsx", import.meta.url)),
  "utf8",
);
const advancedReadingSource = readFileSync(
  fileURLToPath(new URL("../app/la-so/[id]/nang-cao/page.tsx", import.meta.url)),
  "utf8",
);

describe("Google Ads tracking markers", () => {
  it("queues gtag calls with the Arguments shape expected by gtag.js", () => {
    for (const source of [deferredLoaderSource, reporterSource]) {
      expect(source).toContain("window.dataLayer?.push(arguments)");
      expect(source).not.toContain("window.dataLayer?.push(args)");
    }

    const queue: unknown[] = [];
    function gtag() {
      // eslint-disable-next-line prefer-rest-params -- The regression test must preserve the native Arguments shape.
      queue.push(arguments);
    }

    gtag("event", "checkpoint_a");

    expect(Array.isArray(queue[0])).toBe(false);
    expect(Object.prototype.toString.call(queue[0])).toBe("[object Arguments]");
    expect(Array.from(queue[0] as IArguments)).toEqual(["event", "checkpoint_a"]);
  });

  it("uses GA4 as the single page-view owner for initial and SPA navigation", () => {
    expect(analyticsSource).not.toContain("GoogleAnalyticsPageView");
    expect(deferredLoaderSource).toContain('gtag("config", measurementId)');
    expect(deferredLoaderSource).not.toContain("send_page_view: false");
  });

  it("mounts the event reporter alongside the Google tag", () => {
    expect(analyticsSource).toContain("GoogleAdsEventReporter");
    expect(analyticsSource).toContain("GoogleAnalyticsDeferredLoader");
    expect(analyticsSource).toContain("GOOGLE_ADS_ID");
    expect(deferredLoaderSource).toContain("googletagmanager.com/gtag/js");
    expect(deferredLoaderSource).toContain('from "next/script"');
    expect(deferredLoaderSource).toContain('strategy="afterInteractive"');
    expect(deferredLoaderSource).not.toContain("setTimeout(loadGoogleTag, 12000)");
    expect(deferredLoaderSource).not.toContain('document.addEventListener("pointerdown"');
    expect(deferredLoaderSource).toContain('gtag("config", adsId)');
  });

  it("dedupes page-load conversions by conversion intent and order/chart id", () => {
    expect(reporterSource).toContain("localStorage");
    expect(reporterSource).toContain("created=1");
    expect(reporterSource).toContain("orderCode");
    expect(reporterSource).toContain("/api/payments/status");
    expect(reporterSource).toContain("verified");
    expect(reporterSource).toContain("paid_reading_request");
  });

  it("reports allowlisted auth and checkout URL markers without PII", () => {
    expect(reporterSource).toContain('accountResult === "login" || accountResult === "register"');
    expect(reporterSource).toContain('"account_completed"');
    expect(reporterSource).toContain('params.get("claimed") === "1"');
    expect(reporterSource).toContain('"guest_chart_claimed"');
    expect(reporterSource).toContain('"checkout_cancelled"');
    expect(reporterSource).toContain('checkout === "cancelled" || status === "cancelled"');
    expect(reporterSource).toContain('"checkout_failed"');
    expect(reporterSource).toContain('new Set(["error", "unavailable", "invalid", "forbidden", "disabled"])');
    expect(reporterSource).toContain("method: form.dataset.adMethod");
    expect(reporterSource).not.toContain("email:");
    expect(reporterSource).not.toContain("full_name:");
    expect(reporterSource).not.toContain("birth_date:");
  });

  it("does not persistently dedupe separate valid account completions", () => {
    const accountBlockStart = reporterSource.indexOf(
      'if (accountResult === "login" || accountResult === "register")',
    );
    const accountBlockEnd = reporterSource.indexOf('if (params.get("claimed")', accountBlockStart);
    const accountBlock = reporterSource.slice(accountBlockStart, accountBlockEnd);

    expect(accountBlock).toContain("sendOnceInMemory(");
    expect(accountBlock).not.toMatch(/\bsendOnce\(/);
  });

  it("clears handled URL markers and keeps purchase server-verified", () => {
    expect(reporterSource).toContain('params.delete("account")');
    expect(reporterSource).toContain('params.delete("claimed")');
    expect(reporterSource).toContain('params.delete("checkout")');
    expect(reporterSource).toContain("window.history.replaceState");
    expect(reporterSource).toContain("/api/payments/status");
    expect(reporterSource).toContain("if (cancelled || !paymentStatus?.verified) return;");
  });

  it("deduplicates without storage and keeps fallback checkout attempts navigation-scoped", () => {
    expect(reporterSource).toContain("const trackedEvents = new Set<string>();");
    expect(reporterSource).toContain("function sendOnceInMemory(");
    expect(reporterSource).toContain("const reportCheckoutEvent = orderCode ? sendOnce : sendOnceInMemory;");
    expect(reporterSource).toContain("reportCheckoutEvent(orderCode || `${pathname}:${chartId}`");
  });

  it("marks chart and checkout forms with explicit ads events", () => {
    expect(chartFormSource).toContain('name="adSource"');
    expect(chartFormSource).toContain('data-ad-event="create_chart_submit"');
    expect(coinTopupSource).toContain('data-ad-event="begin_checkout"');
    expect(topupPageSource).toContain('data-ad-event="begin_checkout"');
    expect(quickReadingSource).toContain('data-ad-event="begin_checkout"');
  });

  it("marks the completed paid-reading root with its reading id", () => {
    expect(advancedReadingSource).toContain('data-ad-view="reading_completed"');
    expect(advancedReadingSource).toContain("data-reading-id={fullReading!.id}");
    expect(reporterSource).toContain("const readingId = element.dataset.readingId");
    expect(reporterSource).toContain("reading_id: readingId || undefined");
  });

  it("re-scans completed-reading markers after a same-path query and RSC refresh", () => {
    expect(fullReadingJobPanelSource).toContain(
      'router.replace(`/la-so/${chartId}/nang-cao?reading=${readingId}`)',
    );
    expect(fullReadingJobPanelSource).toContain("router.refresh()");

    const viewObserverSource = reporterSource.slice(
      reporterSource.indexOf('document.querySelectorAll<HTMLElement>("[data-ad-view]")'),
    );
    expect(viewObserverSource).toContain("}, [pathname, searchParams]);");
  });
});
