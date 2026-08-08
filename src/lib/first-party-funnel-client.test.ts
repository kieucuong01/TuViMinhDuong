import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { classifyClientFunnelContext, organicEventFunnelStage } from "@/lib/first-party-funnel-client";

describe("first-party funnel client", () => {
  it("reduces acquisition input to categorical source, landing class, and tool", () => {
    expect(classifyClientFunnelContext({
      pathname: "/tu-vi-tai-loc-dau-tu",
      search: "?utm_source=chatgpt&utm_term=private-query",
      referrer: "https://chatgpt.com/c/private-conversation",
      sourceSlug: "tu-vi-tai-loc-dau-tu",
    })).toEqual({ source: "ai", landingClass: "wealth_tool", tool: "wealth" });

    expect(JSON.stringify(classifyClientFunnelContext({
      pathname: "/xem-tuoi/vo-chong",
      search: "?utm_medium=cpc&utm_term=private-query",
      referrer: "",
      sourceSlug: "xem-tuoi-vo-chong",
    }))).not.toContain("private-query");
  });

  it("maps organic product events onto the canonical funnel without inventing paid stages", () => {
    expect(organicEventFunnelStage("wealth_tool_view")).toBe("tool_view");
    expect(organicEventFunnelStage("wealth_submit")).toBe("submit");
    expect(organicEventFunnelStage("wealth_result")).toBe("result");
    expect(organicEventFunnelStage("wealth_next_step")).toBe("save_intent");
    expect(organicEventFunnelStage("compatibility_evidence_open")).toBeNull();
  });

  it("mounts one route reporter and keeps the existing analytics reporters", () => {
    const googleAnalytics = readFileSync(
      fileURLToPath(new URL("../components/google-analytics-route-gate.tsx", import.meta.url)),
      "utf8",
    );
    const organicAnalytics = readFileSync(fileURLToPath(new URL("./client-analytics.ts", import.meta.url)), "utf8");

    expect(googleAnalytics).toContain("FirstPartyFunnelReporter");
    expect(googleAnalytics).toContain("GoogleAdsEventReporter");
    expect(googleAnalytics).toContain("OrganicToolEventReporter");
    expect(organicAnalytics).toContain("reportOrganicToolFunnelEvent");
  });
});
