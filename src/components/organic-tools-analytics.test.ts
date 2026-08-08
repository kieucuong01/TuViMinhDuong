import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

function source(path: string) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

const dateFinderSource = source("src/components/date-range-finder.tsx");
const birthHourSource = source("src/components/birth-hour-comparison.tsx");
const ageToolSource = source("src/components/age-tool.tsx");
const homeSource = source("src/app/page.tsx");
const chartFormSource = source("src/components/chart-form.tsx");
const analyticsRouteGateSource = source("src/components/google-analytics-route-gate.tsx");
const eventReporterSource = source("src/components/organic-tool-event-reporter.tsx");

describe("organic tool analytics", () => {
  it("sends date finder events without specific birth-year or birth-date data", () => {
    expect(dateFinderSource).toContain('trackOrganicToolEvent("date_finder_submitted"');
    expect(dateFinderSource).toContain("range_days");
    expect(dateFinderSource).toContain("has_birth_year");
    expect(dateFinderSource).toContain('trackOrganicToolEvent("date_finder_result_selected"');
    expect(dateFinderSource).toContain("score_band");
    const submitCall = dateFinderSource.match(/trackOrganicToolEvent\("date_finder_submitted"[\s\S]*?\}\);/)?.[0] || "";
    expect(submitCall).not.toContain("birthYear:");
    expect(submitCall).not.toContain("birthYear,");
    expect(submitCall).not.toContain("birth_date");
  });

  it("sends unknown-hour beta events without name or date params", () => {
    expect(birthHourSource).toContain('trackOrganicToolEvent("birth_hour_compare_submitted"');
    expect(birthHourSource).toContain('trackOrganicToolEvent("birth_hour_candidate_selected"');
    expect(birthHourSource).toContain("hour_branch");
    expect(birthHourSource).not.toContain("full_name");
    expect(birthHourSource).not.toContain("birth_date");
  });

  it("routes date finder CTA source into the final create-chart source", () => {
    expect(homeSource).toContain("safeHomeAdSource");
    expect(homeSource).toContain('params.source === "date_finder"');
    expect(homeSource).toContain("chartAdSource");
    expect(homeSource).toContain("<ChartForm adSource={chartAdSource} />");
    expect(homeSource).toContain('params.source === "seo_article"');
  });

  it("tracks the Xem Tuổi funnel without birth details", () => {
    expect(ageToolSource).toContain('trackOrganicToolEvent("age_tool_view"');
    expect(ageToolSource).toContain('trackOrganicToolEvent("age_tool_submit"');
    expect(ageToolSource).toContain('trackOrganicToolEvent("age_tool_result"');
    expect(ageToolSource).toContain('trackOrganicToolEvent("age_tool_related_click"');
    expect(ageToolSource).toContain('trackOrganicToolEvent("age_tool_chart_cta"');
    const analyticsCalls = ageToolSource.match(/trackOrganicToolEvent\([\s\S]*?\}\)/g)?.join("\n") || "";
    expect(analyticsCalls).not.toContain("firstDate:");
    expect(analyticsCalls).not.toContain("secondDate:");
    expect(analyticsCalls).not.toContain("firstGender:");
    expect(analyticsCalls).not.toContain("secondGender:");
  });
  it("mounts one delegated reporter and marks the focused chart forms", () => {
    expect(analyticsRouteGateSource).toContain("<OrganicToolEventReporter />");
    expect(eventReporterSource).toContain('document.addEventListener("submit"');
    expect(eventReporterSource).toContain('document.addEventListener("click"');
    expect(eventReporterSource).not.toMatch(/FormData|fullName|birth|gender|email|phone|href/);
    expect(chartFormSource).toContain("data-organic-submit={organicSubmitEvent}");
    expect(chartFormSource).toContain("data-organic-placement={organicPlacement}");
    expect(chartFormSource).toContain('"annual_2026_submit"');
    expect(chartFormSource).toContain('"annual_2026_landing_form"');
  });
});

describe("trackOrganicToolEvent", () => {
  it("queues the first page-view event before the Google tag loader is ready", async () => {
    const { trackOrganicToolEvent } = await import("@/lib/client-analytics");
    const dataLayer: unknown[] = [];
    vi.stubGlobal("window", { dataLayer });

    trackOrganicToolEvent("compatibility_tool_view");

    expect(dataLayer).toHaveLength(1);
    expect(Array.from(dataLayer[0] as ArrayLike<unknown>)).toEqual([
      "event",
      "compatibility_tool_view",
      { event_category: "organic_tools" },
    ]);
    vi.unstubAllGlobals();
  });

  it("drops sensitive parameter keys before calling gtag", async () => {
    const { trackOrganicToolEvent } = await import("@/lib/client-analytics");
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });

    trackOrganicToolEvent("date_finder_submitted", {
      task: "opening",
      range_days: 10,
      has_birth_year: true,
      birthYear: 1990,
      fullName: "Test",
      gender: "female",
      sex: "female",
      personGender: "female",
      person_gender: "female",
      lunarYear: 1989,
      chart_id: "chart-secret",
      email: "reader@example.com",
      phone: "0900000000",
      birth_timestamp: "1990-01-01T00:00:00Z",
      unexpected: "must-not-leak",
      canChi: "Kỷ Tỵ",
    });

    expect(gtag).toHaveBeenCalledWith("event", "date_finder_submitted", {
      event_category: "organic_tools",
      task: "opening",
      range_days: 10,
      has_birth_year: true,
    });

    vi.unstubAllGlobals();
  });

  it("maps wealth routes to categorical events without exposing the chart id", async () => {
    const { organicToolRouteEvent } = await import("@/lib/client-analytics");

    expect(organicToolRouteEvent("/tu-vi-tai-loc-dau-tu", new URLSearchParams())).toEqual({
      name: "wealth_tool_view",
      params: {},
    });
    expect(organicToolRouteEvent("/la-so/private-chart-id", new URLSearchParams("view=tai-loc&created=1"))).toEqual({
      name: "wealth_result",
      params: { entry_state: "created" },
    });
    expect(organicToolRouteEvent("/la-so/private-chart-id", new URLSearchParams("view=tai-loc"))).toEqual({
      name: "wealth_result",
      params: { entry_state: "return" },
    });
    expect(JSON.stringify(organicToolRouteEvent("/la-so/private-chart-id", new URLSearchParams("view=tai-loc"))))
      .not.toContain("private-chart-id");
  });

  it("maps annual routes and submissions without exposing birth data", async () => {
    const { organicToolClickEvents, organicToolRouteEvent, organicToolSubmitEvent } = await import("@/lib/client-analytics");

    expect(organicToolRouteEvent("/xem-tu-vi-2026", new URLSearchParams())).toEqual({
      name: "annual_2026_tool_view",
      params: {},
    });
    expect(organicToolRouteEvent("/la-so/private-chart-id", new URLSearchParams("view=nam-2026&created=1"))).toEqual({
      name: "annual_2026_result",
      params: { entry_state: "created" },
    });
    expect(organicToolSubmitEvent({ organicSubmit: "annual_2026_submit", organicPlacement: "annual_2026_landing_form" })).toEqual({
      name: "annual_2026_submit",
      params: { placement: "annual_2026_landing_form" },
    });
    expect(organicToolClickEvents({ organicClick: "annual_2026_related_tool_click", organicTarget: "/xem-ngay" })).toEqual([
      { name: "annual_2026_related_tool_click", params: { target: "xem_ngay" } },
    ]);
  });

  it("maps only developer-authored wealth markers to submit and evidence events", async () => {
    const { organicToolClickEvents, organicToolSubmitEvent } = await import("@/lib/client-analytics");

    expect(organicToolSubmitEvent({ organicSubmit: "wealth_submit", organicPlacement: "wealth_landing_form" })).toEqual({
      name: "wealth_submit",
      params: { placement: "wealth_landing_form" },
    });
    expect(organicToolClickEvents({ organicClick: "wealth_evidence_click", organicTargetPalace: "tai_bach" })).toEqual([
      { name: "wealth_evidence_click", params: { target_palace: "tai_bach" } },
      { name: "wealth_next_step", params: { next_step: "palace_reference", target_palace: "tai_bach" } },
    ]);
    expect(organicToolSubmitEvent({ organicSubmit: "unknown", organicPlacement: "reader@example.com" })).toBeNull();
    expect(organicToolClickEvents({ organicClick: "unknown", organicTargetPalace: "private-id" })).toEqual([]);
  });
});
