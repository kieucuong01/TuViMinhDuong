import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getChart: vi.fn(),
  getCurrentUser: vi.fn(),
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

vi.mock("@/lib/auth", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

const fullContent = `# Bản tổng quan lá số của bạn

Mở đầu cá nhân hóa.

## 1. Khí chất và cách ra quyết định

INSIGHT_MỘT

## 2. Công việc và nguồn lực

INSIGHT_HAI

## 3. Quan hệ và nhịp sống

SECRET_INSIGHT_BA

## 4. Vận hiện tại

SECRET_INSIGHT_BỐN`;

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
    mocks.getCurrentUser.mockResolvedValue(null);
    mocks.getChart.mockResolvedValue({ id: "chart-1", userId: null, chart: { input: { fullName: "Test" } } });
    mocks.getFreeOverviewStatus.mockReturnValue({
      status: "ready",
      content: fullContent,
      source: "seed-rules",
      model: "interpretation-rules-v2",
      generatedAt: "2026-07-15T00:00:00.000Z",
      wordCount: 40,
      jobStatus: "completed",
    });
  });

  it("returns only the first two insights to a guest", async () => {
    const response = await getOverview();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.content).toContain("INSIGHT_MỘT");
    expect(body.content).toContain("INSIGHT_HAI");
    expect(body.content).not.toContain("SECRET_INSIGHT_BA");
    expect(body.content).not.toContain("SECRET_INSIGHT_BỐN");
    expect(Object.keys(body).sort()).toEqual(["content", "status", "wordCount"]);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("allowlists fallback fields for a restricted viewer", async () => {
    mocks.getFreeOverviewStatus.mockReturnValue({
      status: "fallback",
      content: "Fallback content.",
      source: "seed-rules",
      wordCount: 2,
      jobStatus: "failed",
      error: "internal-only",
    });

    const response = await getOverview();
    const body = await response.json();

    expect(body).toEqual({
      status: "fallback",
      content: "Fallback content.",
      wordCount: expect.any(Number),
    });
  });

  it("returns all four insights to the chart owner", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", role: "USER" });
    mocks.getChart.mockResolvedValue({ id: "chart-1", userId: "user-1", chart: { input: { fullName: "Test" } } });

    const response = await getOverview();
    const body = await response.json();

    expect(body.content).toContain("SECRET_INSIGHT_BA");
    expect(body.content).toContain("SECRET_INSIGHT_BỐN");
  });

  it("keeps a signed-in non-owner at the first two insights", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", role: "USER" });

    const response = await getOverview();
    const body = await response.json();

    expect(body.content).toContain("INSIGHT_HAI");
    expect(body.content).not.toContain("SECRET_");
  });

  it("returns all four insights to an admin even when the chart has another owner", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    mocks.getChart.mockResolvedValue({ id: "chart-1", userId: "user-2", chart: { input: { fullName: "Test" } } });

    const response = await getOverview();
    const body = await response.json();

    expect(body.content).toContain("SECRET_INSIGHT_BA");
    expect(body.content).toContain("SECRET_");
  });

  it("fails closed for a guest when the seed structure is malformed", async () => {
    mocks.getFreeOverviewStatus.mockReturnValue({
      status: "ready",
      content: "NỘI_DUNG_KHÔNG_CÓ_RANH_GIỚI",
      source: "seed-rules",
      model: "interpretation-rules-v2",
      generatedAt: "2026-07-15T00:00:00.000Z",
      wordCount: 4,
      jobStatus: "completed",
    });

    const response = await getOverview();
    const body = await response.json();

    expect(body.content).toBe("");
  });

  it("returns 404 when the chart does not exist", async () => {
    mocks.getChart.mockResolvedValue(null);

    const response = await getOverview("missing");

    expect(response.status).toBe(404);
  });
});
