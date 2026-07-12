import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

const pageSource = source("src/app/lap-la-so/khong-nho-gio-sinh/page.tsx");
const componentSource = source("src/components/birth-hour-comparison.tsx");
const sitemapSource = source("src/app/sitemap.ts");

describe("unknown birth hour beta page", () => {
  it("publishes a noindex beta route outside the sitemap", () => {
    expect(pageSource).toContain("robots: { index: false, follow: true }");
    expect(pageSource).toContain("<BirthHourComparison");
    expect(sitemapSource).not.toContain("khong-nho-gio-sinh");
  });

  it("compares hours before asking for a name or creating a chart", () => {
    expect(componentSource).toContain("compareBirthHours");
    expect(componentSource).toContain("birth-hour-compare-form");
    expect(componentSource).toContain("birth_hour_compare_submitted");
    expect(componentSource).toContain("birth_hour_candidate_selected");
    expect(componentSource).toContain("selectedHours.length >= 3");
  });

  it("only submits the chosen candidate through the existing chart action", () => {
    expect(componentSource).toContain("createChartAction");
    expect(componentSource).toContain('name="adSource" value="unknown_hour_tool"');
    expect(componentSource).toContain('name="birthHour"');
    expect(componentSource).toContain('name="fullName"');
    expect(componentSource).toContain("candidate.birthHour === chosenHour");
  });
});
