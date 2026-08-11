import { describe, expect, it } from "vitest";
import {
  chartCreationRateLimitExceeded,
  normalizeChartFullName,
  normalizeRequestIp,
  validateChartFullName,
  validateChartSubmissionInput,
} from "@/lib/chart-submission-guard";
import type { ChartInput } from "@/lib/chart";

const validChartInput: ChartInput = {
  fullName: "HoangLong",
  gender: "male",
  calendarType: "solar",
  day: 29,
  month: 2,
  year: 1992,
  birthHour: 4,
  birthMinute: 0,
  viewYear: 2026,
  timezone: "Asia/Bangkok",
};

describe("chart submission guard", () => {
  it("normalizes ordinary Vietnamese names", () => {
    expect(normalizeChartFullName("  Nguyen   Thi   Lan  ")).toBe("Nguyen Thi Lan");
    expect(validateChartFullName("  Tran Van A  ")).toEqual({ ok: true, fullName: "Tran Van A" });
    expect(validateChartFullName("HoangLong")).toEqual({ ok: true, fullName: "HoangLong" });
    expect(validateChartFullName("NgocHuyen")).toEqual({ ok: true, fullName: "NgocHuyen" });
  });

  it("rejects scanner and SQL injection names before chart creation", () => {
    expect(validateChartFullName("if(now()=sysdate(),sleep(15),0)")).toMatchObject({ ok: false, reason: "suspicious" });
    expect(validateChartFullName("abc' OR 1=(SELECT 1 FROM PG_SLEEP(15))--")).toMatchObject({ ok: false, reason: "suspicious" });
    expect(validateChartFullName("fnfOzvSR-1 waitfor delay '0:0:15' --")).toMatchObject({ ok: false, reason: "suspicious" });
  });

  it("rejects malformed and impossible birth inputs before the chart engine runs", () => {
    expect(validateChartSubmissionInput(validChartInput)).toEqual({ ok: true });
    expect(validateChartSubmissionInput({ ...validChartInput, day: Number.NaN })).toEqual({
      ok: false,
      reason: "invalid_input",
    });
    expect(validateChartSubmissionInput({ ...validChartInput, day: 31, month: 2 })).toEqual({
      ok: false,
      reason: "invalid_date",
    });
    expect(validateChartSubmissionInput({ ...validChartInput, birthHour: 3 })).toEqual({
      ok: false,
      reason: "invalid_input",
    });
    expect(validateChartSubmissionInput({ ...validChartInput, calendarType: "lunar", day: 31 })).toEqual({
      ok: false,
      reason: "invalid_date",
    });
  });

  it("extracts the first public client IP from proxy headers", () => {
    expect(normalizeRequestIp(" 203.0.113.10, 10.0.0.1 ")).toBe("203.0.113.10");
    expect(normalizeRequestIp("::ffff:198.51.100.7")).toBe("198.51.100.7");
  });

  it("flags IPs that already reached the chart creation limit", () => {
    expect(chartCreationRateLimitExceeded(19)).toBe(false);
    expect(chartCreationRateLimitExceeded(20)).toBe(true);
  });
});
