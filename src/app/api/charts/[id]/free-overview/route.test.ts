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

async function getOverview(chartId = "chart-1") {
  vi.resetModules();
  const { GET } = await import("./route");
  return GET(new Request(`http://test.local/api/charts/${chartId}/free-overview`), {
    params: Promise.resolve({ id: chartId }),
  });
}

describe("free overview GET route", () => {
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
  });

  it("returns a fallback payload immediately without starting generation", async () => {
    const response = await getOverview();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "fallback",
      content: "## Tổng quan miễn phí\nBản nhanh.",
      source: "instant-template",
      wordCount: 5,
      jobStatus: "idle",
    });
    expect(mocks.getFreeOverviewStatus).toHaveBeenCalledTimes(1);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("server-timing")).toContain("getChart");
  });

  it("returns 404 when the chart does not exist", async () => {
    mocks.getChart.mockResolvedValue(null);

    const response = await getOverview("missing");
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toContain("Không tìm thấy");
  });
});
