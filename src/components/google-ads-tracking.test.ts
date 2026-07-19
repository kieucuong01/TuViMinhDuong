import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const reporterSource = readFileSync(fileURLToPath(new URL("./google-ads-event-reporter.tsx", import.meta.url)), "utf8");
const pageViewSource = readFileSync(fileURLToPath(new URL("./google-analytics-page-view.tsx", import.meta.url)), "utf8");
const analyticsSource = readFileSync(fileURLToPath(new URL("./google-analytics.tsx", import.meta.url)), "utf8");
const deferredLoaderSource = readFileSync(
  fileURLToPath(new URL("./google-analytics-deferred-loader.tsx", import.meta.url)),
  "utf8",
);
const chartFormSource = readFileSync(fileURLToPath(new URL("./chart-form.tsx", import.meta.url)), "utf8");
const coinTopupSource = readFileSync(fileURLToPath(new URL("./coin-topup-modal.tsx", import.meta.url)), "utf8");
const topupPageSource = readFileSync(fileURLToPath(new URL("../app/nap-xu/page.tsx", import.meta.url)), "utf8");
const quickReadingSource = readFileSync(fileURLToPath(new URL("./quick-reading-form.tsx", import.meta.url)), "utf8");

describe("Google Ads tracking markers", () => {
  it("queues gtag calls with the Arguments shape expected by gtag.js", () => {
    for (const source of [deferredLoaderSource, pageViewSource, reporterSource]) {
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

  it("marks chart and checkout forms with explicit ads events", () => {
    expect(chartFormSource).toContain('name="adSource"');
    expect(chartFormSource).toContain('data-ad-event="create_chart_submit"');
    expect(coinTopupSource).toContain('data-ad-event="begin_checkout"');
    expect(topupPageSource).toContain('data-ad-event="begin_checkout"');
    expect(quickReadingSource).toContain('data-ad-event="begin_checkout"');
  });
});
