import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const finderSource = existsSync("src/components/date-range-finder.tsx")
  ? readFileSync("src/components/date-range-finder.tsx", "utf8")
  : "";
const dateViewSource = readFileSync("src/components/date-view.tsx", "utf8");
const pageSource = readFileSync("src/app/xem-ngay/page.tsx", "utf8");
const cssSource = readFileSync("src/app/globals.css", "utf8");

describe("date range finder UI contract", () => {
  it("offers bounded, labeled inputs and renders ranked results", () => {
    expect(finderSource).toContain("rankDateRange");
    expect(finderSource).toContain('data-testid="date-finder-form"');
    expect(finderSource).toContain('data-testid="date-finder-from"');
    expect(finderSource).toContain('data-testid="date-finder-to"');
    expect(finderSource).toContain('data-testid="date-finder-task"');
    expect(finderSource).toContain('data-testid="date-finder-results"');
    expect(finderSource).toContain("Tối đa 60 ngày");
    expect(finderSource).toContain("Đối chiếu thêm với lá số");
    expect(finderSource).toContain("source=date_finder#lap-la-so");
  });

  it("keeps finder state shareable without adding personal birth data", () => {
    expect(finderSource).toContain('params.set("mode", "finder")');
    expect(finderSource).toContain('params.set("task", task)');
    expect(finderSource).toContain('params.set("from", from)');
    expect(finderSource).toContain('params.set("to", to)');
    expect(finderSource).toContain('params.set("birthYear", birthYear)');
    expect(finderSource).not.toContain('params.set("fullName"');
    expect(finderSource).not.toContain('params.set("day"');
  });

  it("passes safe search params from the server page into the interactive view", () => {
    expect(pageSource).toContain("mode?: string | string[]");
    expect(pageSource).toContain("task?: string | string[]");
    expect(pageSource).toContain("from?: string | string[]");
    expect(pageSource).toContain("to?: string | string[]");
    expect(dateViewSource).toContain("DateRangeFinder");
    expect(dateViewSource).toContain("initialFinderTask");
  });

  it("uses a responsive result grid and accessible focus states", () => {
    expect(cssSource).toContain(".date-finder-panel");
    expect(cssSource).toContain(".date-finder-result-grid");
    expect(cssSource).toContain(".date-finder-form input:focus-visible");
    expect(cssSource).toMatch(/@media \(max-width: 720px\)[\s\S]*\.date-finder-form/);
  });
});
