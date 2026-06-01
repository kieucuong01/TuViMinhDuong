import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const chartFormSource = readFileSync(fileURLToPath(new URL("./chart-form.tsx", import.meta.url)), "utf8");
const globalsCss = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

describe("chart form compact picker UI", () => {
  it("uses select controls for date parts and view year", () => {
    expect(chartFormSource).toMatch(/<select name="day"[\s\S]*data-testid="chart-day"/);
    expect(chartFormSource).toMatch(/<select name="month"[\s\S]*data-testid="chart-month"/);
    expect(chartFormSource).toMatch(/<select name="year"[\s\S]*data-testid="chart-year"/);
    expect(chartFormSource).toMatch(/<select name="viewYear"[\s\S]*data-testid="chart-view-year"/);
    expect(chartFormSource).not.toMatch(/<input[^>]+name="day"/);
    expect(chartFormSource).not.toMatch(/<input[^>]+name="month"/);
    expect(chartFormSource).not.toMatch(/<input[^>]+name="year"/);
    expect(chartFormSource).not.toMatch(/<input[^>]+name="viewYear"/);
  });

  it("keeps birth years bounded while letting the viewed year stay broad", () => {
    expect(chartFormSource).toContain("const birthYears = descendingYears(1900, currentYear);");
    expect(chartFormSource).toContain("const viewYears = descendingYears(1900, 2100);");
  });

  it("only keeps calendar, gender, and 2026 view year preselected", () => {
    expect(chartFormSource).toContain("const DEFAULT_VIEW_YEAR = 2026;");
    expect(chartFormSource).toMatch(/<select name="day"[\s\S]*defaultValue=""/);
    expect(chartFormSource).toMatch(/<select name="month"[\s\S]*defaultValue=""/);
    expect(chartFormSource).toMatch(/<select name="year"[\s\S]*defaultValue=""/);
    expect(chartFormSource).toMatch(/<select name="birthHour"[\s\S]*defaultValue=""/);
    expect(chartFormSource).toMatch(/<select name="calendarType"[\s\S]*defaultValue="solar"/);
    expect(chartFormSource).toMatch(/<select name="gender"[\s\S]*defaultValue="male"/);
    expect(chartFormSource).toMatch(/<select name="viewYear"[\s\S]*defaultValue=\{DEFAULT_VIEW_YEAR\}/);
    expect(chartFormSource).not.toContain("defaultValue={currentYear}");
  });

  it("uses in-control placeholders for fields users must provide", () => {
    expect(chartFormSource).toContain('placeholder="Họ và tên"');
    expect(chartFormSource).toContain('<option value="" disabled hidden>Ngày</option>');
    expect(chartFormSource).toContain('<option value="" disabled hidden>Tháng</option>');
    expect(chartFormSource).toContain('<option value="" disabled hidden>Năm sinh</option>');
    expect(chartFormSource).toContain('<option value="" disabled hidden>Giờ sinh</option>');
  });

  it("keeps birth-hour labels short enough for compact controls", () => {
    expect(chartFormSource).toContain("Dần: 3h - 5h");
    expect(chartFormSource).not.toContain("03h - 04h59");
  });

  it("styles the hero form as a compact choice surface", () => {
    expect(globalsCss).toMatch(/\.hero-form-card \.chart-name-control\s*{[\s\S]*min-height:\s*3\.65rem/);
    expect(globalsCss).toMatch(/\.hero-form-card \.chart-birth-field \.birth-date-grid\s*{[\s\S]*grid-template-columns:[^;]*minmax\(4\.6rem/);
    expect(globalsCss).toMatch(/\.hero-form-card \.chart-field-label,[\s\S]*clip:\s*rect\(0, 0, 0, 0\)/);
    expect(globalsCss).toMatch(/\.hero-form-card \.birth-date-grid input,[\s\S]*\.hero-form-card \.birth-date-grid select/);
  });
});
