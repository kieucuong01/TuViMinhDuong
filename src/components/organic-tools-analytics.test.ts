import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

function source(path: string) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

const dateFinderSource = source("src/components/date-range-finder.tsx");
const birthHourSource = source("src/components/birth-hour-comparison.tsx");
const ageToolSource = source("src/components/age-tool.tsx");
const homeSource = source("src/app/page.tsx");

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
});

describe("trackOrganicToolEvent", () => {
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
});
