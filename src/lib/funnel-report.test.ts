import { describe, expect, it } from "vitest";
import { buildAdminFunnelDashboard } from "@/lib/funnel-report";

const now = new Date("2026-08-05T12:00:00.000Z");

function event(
  id: string,
  name: string,
  daysAgo: number,
  overrides: Partial<{
    anonymousSessionId: string | null;
    userId: string | null;
    source: string;
    tool: string;
  }> = {},
) {
  return {
    id,
    name,
    anonymousSessionId: overrides.anonymousSessionId ?? "session-a",
    userId: overrides.userId ?? null,
    source: overrides.source ?? "organic_search",
    tool: overrides.tool ?? "chart",
    createdAt: new Date(now.getTime() - daysAgo * 86_400_000),
  };
}

describe("buildAdminFunnelDashboard", () => {
  it("links an anonymous journey to the account without double counting the person", () => {
    const report = buildAdminFunnelDashboard({
      now,
      events: [
        event("a-landing", "landing", 1),
        event("a-tool", "tool_view", 1),
        event("a-submit", "submit", 1),
        event("a-result", "result", 1),
        event("a-account", "account", 1, { userId: "user-a" }),
        event("a-checkout", "checkout", 1, { anonymousSessionId: null, userId: "user-a" }),
        event("a-paid", "paid", 1, { anonymousSessionId: null, userId: "user-a" }),
        event("b-landing", "landing", 2, { anonymousSessionId: "session-b", source: "ai", tool: "wealth" }),
        event("b-tool", "tool_view", 2, { anonymousSessionId: "session-b", source: "ai", tool: "wealth" }),
        event("b-result", "result", 2, { anonymousSessionId: "session-b", source: "ai", tool: "wealth" }),
      ],
      payments: [],
    });

    const window = report.windows[7];
    expect(window.stages.find((stage) => stage.name === "landing")?.actors).toBe(2);
    expect(window.stages.find((stage) => stage.name === "account")?.actors).toBe(1);
    expect(window.stages.find((stage) => stage.name === "paid")?.actors).toBe(1);
    expect(window.identifiedActors).toBe(1);
    expect(window.anonymousActors).toBe(1);
  });

  it("compares the selected window with the immediately preceding period", () => {
    const report = buildAdminFunnelDashboard({
      now,
      events: [
        event("current-landing", "landing", 1),
        event("current-result", "result", 1),
        event("previous-landing", "landing", 8, { anonymousSessionId: "previous-a" }),
        event("previous-tool", "tool_view", 8, { anonymousSessionId: "previous-a" }),
      ],
      payments: [],
    });

    const landing = report.windows[7].stages.find((stage) => stage.name === "landing");
    expect(landing).toMatchObject({ actors: 1, previousActors: 1, conversionRate: 100, previousConversionRate: 100 });
  });

  it("shows source and tool breakdowns using only categorical fields", () => {
    const report = buildAdminFunnelDashboard({
      now,
      events: [
        event("organic-result", "result", 1),
        event("organic-account", "account", 1, { userId: "user-a" }),
        event("ai-result", "result", 1, { anonymousSessionId: "session-ai", source: "ai", tool: "wealth" }),
      ],
      payments: [],
    });

    expect(report.windows[7].sourceBreakdown.find((row) => row.key === "organic_search")).toMatchObject({
      actors: 1,
      results: 1,
      accounts: 1,
    });
    expect(report.windows[7].toolBreakdown.find((row) => row.key === "wealth")).toMatchObject({
      actors: 1,
      results: 1,
      accounts: 0,
    });
  });

  it("flags pending payments older than 24 hours without counting newer orders", () => {
    const report = buildAdminFunnelDashboard({
      now,
      events: [],
      payments: [
        { status: "PENDING", amountVnd: 199_000, createdAt: new Date(now.getTime() - 25 * 3_600_000) },
        { status: "PENDING", amountVnd: 99_000, createdAt: new Date(now.getTime() - 3 * 3_600_000) },
        { status: "PAID", amountVnd: 299_000, createdAt: new Date(now.getTime() - 48 * 3_600_000) },
      ],
    });

    expect(report.stalePendingOrders).toBe(1);
    expect(report.stalePendingAmountVnd).toBe(199_000);
  });
});
