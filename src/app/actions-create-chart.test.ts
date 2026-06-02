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
});
