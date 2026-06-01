import { describe, expect, it } from "vitest";
import {
  GOOGLE_ADS_EVENT_VALUES,
  googleAdsSendTo,
  normalizeGoogleAdsId,
  shouldTrackGoogleAdsConversion,
} from "@/lib/google-ads";

describe("Google Ads conversion helpers", () => {
  it("normalizes numeric conversion ids to the AW format", () => {
    expect(normalizeGoogleAdsId("1234567890")).toBe("AW-1234567890");
    expect(normalizeGoogleAdsId("AW-987654321")).toBe("AW-987654321");
    expect(normalizeGoogleAdsId("")).toBe("");
  });

  it("builds send_to only when an event has a configured label", () => {
    const labels = {
      create_chart: "abc123",
      begin_checkout: "",
      purchase: "sale456",
    };

    expect(googleAdsSendTo("AW-1234567890", labels, "create_chart")).toBe("AW-1234567890/abc123");
    expect(googleAdsSendTo("AW-1234567890", labels, "begin_checkout")).toBeNull();
    expect(googleAdsSendTo("", labels, "purchase")).toBeNull();
  });

  it("keeps lead and checkout values explicit for campaign optimization", () => {
    expect(GOOGLE_ADS_EVENT_VALUES.create_chart).toBe(5000);
    expect(GOOGLE_ADS_EVENT_VALUES.begin_checkout).toBe(25000);
    expect(GOOGLE_ADS_EVENT_VALUES.paid_reading_request).toBe(50000);
  });

  it("tracks only configured conversion events", () => {
    expect(shouldTrackGoogleAdsConversion("create_chart")).toBe(true);
    expect(shouldTrackGoogleAdsConversion("page_view")).toBe(false);
  });
});
