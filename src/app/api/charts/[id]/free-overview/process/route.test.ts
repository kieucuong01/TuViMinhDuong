import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getChart: vi.fn(),
  getFreeOverviewStatus: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  },
}));

vi.mock("@/lib/data", () => ({
  getChart: mocks.getChart,
  getFreeOverviewStatus: mocks.getFreeOverviewStatus,
}));

async function postProcess(chartId = "chart-1") {
  vi.resetModules();
  const { POST } = await import("./route");
  return POST(new Request(`http://test.local/api/charts/${chartId}/free-overview/process`, { method: "POST" }), {
    params: Promise.resolve({ id: chartId }),
  });
}

describe("free overview process compatibility route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getChart.mockResolvedValue({ id: "chart-1", chart: { input: { fullName: "Test" } } });
    mocks.getFreeOverviewStatus.mockReturnValue({
      status: "ready",
      content: "Bản seed",
      source: "seed-rules",
      model: "interpretation-rules-v2",
      generatedAt: "2026-07-15T00:00:00.000Z",
      wordCount: 1500,
      jobStatus: "completed",
    });
  });

  it("returns ready immediately without scheduling provider work", async () => {
    const response = await postProcess();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ready", chartId: "chart-1" });
    expect(mocks.getFreeOverviewStatus).toHaveBeenCalledTimes(1);
  });

  it("returns 404 for a missing chart", async () => {
    mocks.getChart.mockResolvedValue(null);

    expect((await postProcess("missing")).status).toBe(404);
  });
});
