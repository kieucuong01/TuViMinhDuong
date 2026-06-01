import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const reporterSource = readFileSync(fileURLToPath(new URL("./google-ads-event-reporter.tsx", import.meta.url)), "utf8");
const analyticsSource = readFileSync(fileURLToPath(new URL("./google-analytics.tsx", import.meta.url)), "utf8");
const chartFormSource = readFileSync(fileURLToPath(new URL("./chart-form.tsx", import.meta.url)), "utf8");
const coinTopupSource = readFileSync(fileURLToPath(new URL("./coin-topup-modal.tsx", import.meta.url)), "utf8");
const topupPageSource = readFileSync(fileURLToPath(new URL("../app/nap-xu/page.tsx", import.meta.url)), "utf8");
const quickReadingSource = readFileSync(fileURLToPath(new URL("./quick-reading-form.tsx", import.meta.url)), "utf8");

describe("Google Ads tracking markers", () => {
  it("mounts the event reporter alongside the Google tag", () => {
    expect(analyticsSource).toContain("GoogleAdsEventReporter");
    expect(analyticsSource).toContain("GOOGLE_ADS_ID");
    expect(analyticsSource).toContain("gtag('config', '${GOOGLE_ADS_ID}')");
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
