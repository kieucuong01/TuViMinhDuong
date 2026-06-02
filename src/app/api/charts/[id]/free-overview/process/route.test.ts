import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  revalidatePath: vi.fn(),
  claimFreeOverviewGeneration: vi.fn(),
  failFreeOverviewGeneration: vi.fn(),
  generateAndStoreFreeOverview: vi.fn(),
  getChart: vi.fn(),
  getFreeOverviewStatus: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  },
  after: mocks.after,
}));

vi.mock("@/lib/data", () => ({
  claimFreeOverviewGeneration: mocks.claimFreeOverviewGeneration,
  failFreeOverviewGeneration: mocks.failFreeOverviewGeneration,
  generateAndStoreFreeOverview: mocks.generateAndStoreFreeOverview,
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

describe("free overview process route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getChart.mockResolvedValue({ id: "chart-1", chart: { input: { fullName: "Test" } } });
    mocks.getFreeOverviewStatus.mockReturnValue({
      status: "fallback",
      content: "## Tổng quan miễn phí\nBản nhanh.",
      source: "instant-template",
      wordCount: 5,
      jobStatus: "idle",
    });
    mocks.claimFreeOverviewGeneration.mockResolvedValue({ status: "claimed" });
    mocks.generateAndStoreFreeOverview.mockResolvedValue({
      status: "ready",
      content: "## Tổng quan miễn phí\nBản AI đầy đủ.",
      source: "ai-cache",
      model: "test-model",
      generatedAt: "2026-06-02T00:00:00.000Z",
      wordCount: 1300,
      jobStatus: "completed",
    });
  });

  it("returns 202 immediately and schedules AI generation after the response", async () => {
    const response = await postProcess();
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toEqual({ status: "processing", chartId: "chart-1" });
    expect(mocks.after).toHaveBeenCalledTimes(1);
    expect(mocks.generateAndStoreFreeOverview).not.toHaveBeenCalled();

    await mocks.after.mock.calls[0][0]();

    expect(mocks.generateAndStoreFreeOverview).toHaveBeenCalledWith("chart-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/la-so/chart-1");
  });

  it("does not schedule another job when a fresh pending job exists", async () => {
    mocks.claimFreeOverviewGeneration.mockResolvedValue({
      status: "processing",
      overview: {
        status: "fallback",
        content: "## Tổng quan miễn phí\nBản nhanh.",
        source: "instant-template",
        wordCount: 5,
        jobStatus: "processing",
      },
    });

    const response = await postProcess("chart-processing");
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toEqual({ status: "processing", chartId: "chart-processing" });
    expect(mocks.after).not.toHaveBeenCalled();
  });
});
