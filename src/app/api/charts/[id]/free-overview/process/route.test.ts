import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getChart: vi.fn(),
  getFreeOverviewStatus: vi.fn(),
  claimFreeOverviewGeneration: vi.fn(),
  claimFreeOverviewBlockGeneration: vi.fn(),
  generateAndStoreFreeOverview: vi.fn(),
  generateAndStoreFreeOverviewBlock: vi.fn(),
  after: vi.fn((callback: () => void) => callback()),
}));

vi.mock("next/server", () => ({
  after: mocks.after,
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  },
}));

vi.mock("@/lib/data", () => ({
  claimFreeOverviewGeneration: mocks.claimFreeOverviewGeneration,
  claimFreeOverviewBlockGeneration: mocks.claimFreeOverviewBlockGeneration,
  getChart: mocks.getChart,
  getFreeOverviewStatus: mocks.getFreeOverviewStatus,
  generateAndStoreFreeOverview: mocks.generateAndStoreFreeOverview,
  generateAndStoreFreeOverviewBlock: mocks.generateAndStoreFreeOverviewBlock,
}));

async function postProcess(chartId = "chart-1", block?: string) {
  vi.resetModules();
  const { POST } = await import("./route");
  const query = block ? `?block=${encodeURIComponent(block)}` : "";
  return POST(new Request(`http://test.local/api/charts/${chartId}/free-overview/process${query}`, { method: "POST" }), {
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
    mocks.claimFreeOverviewGeneration.mockResolvedValue({ status: "claimed" });
    mocks.claimFreeOverviewBlockGeneration.mockResolvedValue({ status: "claimed" });
    mocks.generateAndStoreFreeOverviewBlock.mockResolvedValue({ status: "fallback" });
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

  it("returns accepted immediately, persists processing state, and schedules forced LLM generation", async () => {
    const response = await postProcess();

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ status: "processing", chartId: "chart-1" });
    expect(mocks.getFreeOverviewStatus).toHaveBeenCalledTimes(1);
    expect(mocks.claimFreeOverviewGeneration).toHaveBeenCalledWith("chart-1", { input: { fullName: "Test" } });
    expect(mocks.after).toHaveBeenCalledTimes(1);
    expect(mocks.generateAndStoreFreeOverview).toHaveBeenCalledWith("chart-1", { force: true });
  });

  it("schedules only the requested block when block query is present", async () => {
    const response = await postProcess("chart-1", "intro");

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ status: "processing", chartId: "chart-1", block: "intro" });
    expect(mocks.claimFreeOverviewBlockGeneration).toHaveBeenCalledWith("chart-1", { input: { fullName: "Test" } }, "intro");
    expect(mocks.generateAndStoreFreeOverviewBlock).toHaveBeenCalledWith("chart-1", "intro");
    expect(mocks.generateAndStoreFreeOverview).not.toHaveBeenCalled();
  });

  it("rejects invalid block query instead of falling back to full generation", async () => {
    const response = await postProcess("chart-1", "bad-block");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Block luận giải không hợp lệ." });
    expect(mocks.getChart).not.toHaveBeenCalled();
    expect(mocks.claimFreeOverviewGeneration).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing chart", async () => {
    mocks.getChart.mockResolvedValue(null);

    expect((await postProcess("missing")).status).toBe(404);
  });
});
