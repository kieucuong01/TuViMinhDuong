import { describe, expect, it } from "vitest";
import {
  FUNNEL_EVENT_RETENTION_DAYS,
  funnelLandingClass,
  funnelTool,
  parseClientFunnelEvent,
  paymentFunnelAttribution,
} from "@/lib/funnel-events";

const sessionId = "019fc7f3-d19c-73c0-946d-cd7a275f8906";

describe("first-party funnel privacy contract", () => {
  it("accepts only early client stages and bounded categorical values", () => {
    expect(parseClientFunnelEvent({
      name: "tool_view",
      eventId: "119fc7f3-d19c-73c0-946d-cd7a275f8906",
      anonymousSessionId: sessionId,
      source: "organic_search",
      landingClass: "wealth_tool",
      tool: "wealth",
      placement: "wealth_landing_form",
      resultBand: "ready",
    })).toEqual({
      name: "tool_view",
      eventId: "119fc7f3-d19c-73c0-946d-cd7a275f8906",
      anonymousSessionId: sessionId,
      source: "organic_search",
      landingClass: "wealth_tool",
      tool: "wealth",
      placement: "wealth_landing_form",
      resultBand: "ready",
    });

    expect(parseClientFunnelEvent({ name: "paid", eventId: sessionId, anonymousSessionId: sessionId })).toBeNull();
    expect(parseClientFunnelEvent({ name: "reading_complete", eventId: sessionId, anonymousSessionId: sessionId })).toBeNull();
  });

  it("rejects PII, raw URLs, arbitrary keys, invalid sessions, and oversized categories", () => {
    const base = { name: "landing", eventId: sessionId, anonymousSessionId: sessionId };

    for (const forbidden of ["email", "name", "phone", "birthDate", "referrer", "landingPath", "params", "userId", "chartId"]) {
      expect(parseClientFunnelEvent({ ...base, [forbidden]: "private" }), forbidden).toBeNull();
    }
    expect(parseClientFunnelEvent({ ...base, anonymousSessionId: "not-a-session" })).toBeNull();
    expect(parseClientFunnelEvent({ ...base, placement: "x".repeat(65) })).toBeNull();
  });

  it("normalizes routes and tools into a small reporting vocabulary", () => {
    expect(funnelLandingClass("/xem-tu-vi-2026?source=menu")).toBe("annual_tool");
    expect(funnelLandingClass("/tu-vi-tai-loc-dau-tu?utm_source=google")).toBe("wealth_tool");
    expect(funnelLandingClass("/xem-tuoi/vo-chong")).toBe("age_tool");
    expect(funnelLandingClass("/kien-thuc-tu-vi/dai-van-la-gi")).toBe("knowledge");
    expect(funnelLandingClass("https://evil.example/private")).toBe("other");
    expect(funnelTool("xem-tuoi-vo-chong")).toBe("age_compatibility");
    expect(funnelTool("tu-vi-tai-loc-dau-tu")).toBe("wealth");
    expect(funnelTool("xem-tu-vi-2026")).toBe("annual_2026");
    expect(funnelTool("unknown-free-text")).toBe("other");
  });

  it("creates a payment snapshot without raw path, referrer, or contact data", () => {
    const snapshot = paymentFunnelAttribution({
      source: "ai",
      label: "AI",
      confidence: "high",
      landingPath: "/tuong-hop-la-so?utm_term=private-query",
      sourceSlug: "tuong-hop-la-so",
      ctaLocation: "report_footer",
      referrerHost: "chatgpt.com",
      utm: { source: "chatgpt", term: "private-query" },
    });

    expect(snapshot).toEqual({
      source: "ai",
      landingClass: "compatibility_tool",
      tool: "compatibility",
      placement: "report_footer",
    });
    expect(JSON.stringify(snapshot)).not.toMatch(/private-query|chatgpt|referrer|utm/i);
  });

  it("documents a bounded retention window", () => {
    expect(FUNNEL_EVENT_RETENTION_DAYS).toBe(180);
  });
});
