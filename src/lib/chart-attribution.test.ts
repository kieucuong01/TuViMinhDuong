import { describe, expect, it } from "vitest";
import { displayChartAttributionSource, normalizeChartAttribution } from "@/lib/chart-attribution";

describe("normalizeChartAttribution", () => {
  it("classifies paid Google traffic from UTM parameters", () => {
    expect(normalizeChartAttribution({
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "brand",
      landingPath: "/lap-la-so",
      placement: "google_ads_landing",
    })).toMatchObject({
      source: "ads",
      label: "Ads",
      confidence: "high",
      utm: {
        source: "google",
        medium: "cpc",
        campaign: "brand",
      },
    });
  });

  it("classifies organic search from search referrers", () => {
    expect(normalizeChartAttribution({
      referrer: "https://www.google.com/search?q=lap+la+so",
      landingPath: "/",
    })).toMatchObject({
      source: "organic_search",
      label: "Search",
      confidence: "medium",
      referrerHost: "google.com",
    });
  });

  it("classifies AI referrals from source parameters and referrers", () => {
    expect(normalizeChartAttribution({
      utmSource: "chatgpt",
      utmMedium: "ai_referral",
      landingPath: "/",
    })).toMatchObject({
      source: "ai",
      label: "AI",
      confidence: "high",
    });

    expect(normalizeChartAttribution({
      utmSource: "chatgpt.com",
      utmMedium: "ai_referral",
      landingPath: "/",
    })).toMatchObject({
      source: "ai",
      label: "AI",
      confidence: "high",
    });

    expect(normalizeChartAttribution({
      referrer: "https://gemini.google.com/app",
      landingPath: "/",
    })).toMatchObject({
      source: "ai",
      label: "AI",
      confidence: "medium",
      referrerHost: "gemini.google.com",
    });
  });

  it("classifies same-site referrers and known internal source parameters", () => {
    expect(normalizeChartAttribution({
      sourceParam: "seo_article",
      landingPath: "/",
    })).toMatchObject({
      source: "internal",
      label: "Nội bộ",
      confidence: "high",
      placement: "seo_article",
    });

    expect(normalizeChartAttribution({
      referrer: "https://lasotinhhoa.vn/kien-thuc-tu-vi/la-so-tu-vi-la-gi",
      landingPath: "/",
    })).toMatchObject({
      source: "internal",
      label: "Nội bộ",
      confidence: "medium",
      referrerHost: "lasotinhhoa.vn",
    });
  });

  it("classifies empty attribution as direct", () => {
    expect(normalizeChartAttribution({ landingPath: "/" })).toMatchObject({
      source: "direct",
      label: "Direct",
      confidence: "low",
    });
  });
});

describe("displayChartAttributionSource", () => {
  it("keeps historical unknown chatgpt.com attribution in the AI bucket", () => {
    expect(displayChartAttributionSource({ source: "unknown", utmSource: "chatgpt.com" })).toEqual({
      source: "ai",
      label: "AI",
    });
  });
});
