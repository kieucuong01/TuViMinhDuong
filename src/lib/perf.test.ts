import { afterEach, describe, expect, it, vi } from "vitest";
import { logPerfEvent } from "@/lib/perf";

const originalPerfLog = process.env.PERF_LOG;
const originalPerfThreshold = process.env.PERF_LOG_THRESHOLD_MS;

describe("logPerfEvent", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.env.PERF_LOG = originalPerfLog;
    process.env.PERF_LOG_THRESHOLD_MS = originalPerfThreshold;
  });

  it("can force-log important events below the normal duration threshold", () => {
    delete process.env.PERF_LOG;
    process.env.PERF_LOG_THRESHOLD_MS = "999999";
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    logPerfEvent("create_chart_action_failed", 10, { force: true, reason: "timeout" });

    expect(info).toHaveBeenCalledTimes(1);
    expect(info.mock.calls[0][0]).toContain('"event":"create_chart_action_failed"');
    expect(info.mock.calls[0][0]).toContain('"reason":"timeout"');
    expect(info.mock.calls[0][0]).not.toContain('"force"');
  });
});
