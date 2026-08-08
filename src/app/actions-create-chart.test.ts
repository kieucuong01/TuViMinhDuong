import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const actionsSource = readFileSync(fileURLToPath(new URL("./actions.ts", import.meta.url)), "utf8");
const homeSource = readFileSync(fileURLToPath(new URL("./page.tsx", import.meta.url)), "utf8");

describe("createChartAction timeout guard", () => {
  it("wraps chart creation in a timeout and logs failed timing with database env state", () => {
    expect(actionsSource).toContain("withActionTimeout");
    expect(actionsSource).toContain("CREATE_CHART_ACTION_TIMEOUT_MS");
    expect(actionsSource).toContain("createChartTimeoutMs");
    expect(actionsSource).toContain("Number.isFinite(parsed)");
    expect(actionsSource).toContain("create_chart_action_failed");
    expect(actionsSource).toContain("databaseEnvState()");
  });

  it("redirects failed chart creation back to a visible form error", () => {
    expect(actionsSource).toContain("chartError");
    expect(homeSource).toContain("chartError");
    expect(homeSource).toContain("chart-form-error");
  });

  it("allowlists the focused chart experience without accepting a client redirect", () => {
    expect(actionsSource).toContain("function safeChartExperience");
    expect(actionsSource).toContain('experience === "wealth"');
    expect(actionsSource).not.toContain('formData.get("redirectUrl")');
    expect(actionsSource).not.toContain('safeNextPath(formData.get("chartExperience")');
  });

  it("forces annual submissions to 2026 and returns them to the dedicated result", () => {
    expect(actionsSource).toContain('type ChartExperience = "default" | "wealth" | "annual-2026"');
    expect(actionsSource).toContain('value === "annual-2026"');
    expect(actionsSource).toContain('input.viewYear = 2026');
    expect(actionsSource).toContain('error: "/xem-tu-vi-2026#lap-la-so-2026"');
    expect(actionsSource).toContain('`/la-so/${chartId}?view=nam-2026`');
    expect(actionsSource).toContain('experience === "annual-2026" ? "annual_2026"');
  });

  it("starts free LLM generation before redirecting to the chart page", () => {
    expect(actionsSource).toContain('import { after } from "next/server"');
    expect(actionsSource).toContain("generateAndStoreFreeOverview");
    expect(actionsSource).toContain("after(() => {");
    expect(actionsSource).toContain("generateAndStoreFreeOverview(result.chart.id)");
    expect(actionsSource.indexOf("generateAndStoreFreeOverview(result.chart.id)")).toBeLessThan(
      actionsSource.indexOf("redirect(withQueryParams(chartCreationPaths(experience, result.chart.id).success"),
    );
  });
});
