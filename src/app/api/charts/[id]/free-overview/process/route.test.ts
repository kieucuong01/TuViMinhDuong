import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getChart: vi.fn(),
  getFreeOverviewStatus: vi.fn(),
  generateAndStoreFreeOverview: vi.fn(),
  after: vi.fn((callback: () => void) => callback()),
}));

vi.mock("next/server", () => ({
  after: mocks.after,
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  },
}));

vi.mock("@/lib/data", () => ({
  getChart: mocks.getChart,
  getFreeOverviewStatus: mocks.getFreeOverviewStatus,
  generateAndStoreFreeOverview: mocks.generateAndStoreFreeOverview,
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
      status: "fallback",
      content: "Bản seed",
      source: "seed-rules",
      wordCount: 1500,
      jobStatus: "idle",
    });
    mocks.generateAndStoreFreeOverview.mockResolvedValue({
      status: "ready",
      content: "Bản LLM",
      source: "llm",
      model: "deepseek/deepseek-v4-flash",
      generatedAt: "2026-07-20T00:00:00.000Z",
      wordCount: 1500,
      jobStatus: "completed",
    });
  });

  it("returns accepted immediately and schedules LLM generation after the response", async () => {
    const response = await postProcess();

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ status: "processing", chartId: "chart-1" });
    expect(mocks.getFreeOverviewStatus).toHaveBeenCalledTimes(1);
    expect(mocks.after).toHaveBeenCalledTimes(1);
    expect(mocks.generateAndStoreFreeOverview).toHaveBeenCalledWith("chart-1");
  });

  it("returns 404 for a missing chart", async () => {
    mocks.getChart.mockResolvedValue(null);

    expect((await postProcess("missing")).status).toBe(404);
  });
});
