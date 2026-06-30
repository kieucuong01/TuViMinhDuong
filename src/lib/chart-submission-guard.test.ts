import { describe, expect, it } from "vitest";
import {
  chartCreationRateLimitExceeded,
  normalizeChartFullName,
  normalizeRequestIp,
  validateChartFullName,
} from "@/lib/chart-submission-guard";

describe("chart submission guard", () => {
  it("normalizes ordinary Vietnamese names", () => {
    expect(normalizeChartFullName("  Nguyen   Thi   Lan  ")).toBe("Nguyen Thi Lan");
    expect(validateChartFullName("  Tran Van A  ")).toEqual({ ok: true, fullName: "Tran Van A" });
  });

  it("rejects scanner and SQL injection names before chart creation", () => {
    expect(validateChartFullName("fnfOzvSR")).toMatchObject({ ok: false, reason: "suspicious" });
    expect(validateChartFullName("if(now()=sysdate(),sleep(15),0)")).toMatchObject({ ok: false, reason: "suspicious" });
    expect(validateChartFullName("abc' OR 1=(SELECT 1 FROM PG_SLEEP(15))--")).toMatchObject({ ok: false, reason: "suspicious" });
    expect(validateChartFullName("fnfOzvSR-1 waitfor delay '0:0:15' --")).toMatchObject({ ok: false, reason: "suspicious" });
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
