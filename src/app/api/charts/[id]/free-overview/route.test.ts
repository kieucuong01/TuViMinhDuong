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
    mocks.getChart.mockResolvedValue({ id: "chart-1", chart: { input: { fullName: "Test" } } });
    mocks.getFreeOverviewStatus.mockReturnValue({
      status: "fallback",
      content: "## Tổng quan miễn phí\nBản nhanh.",
      source: "instant-template",
      wordCount: 7,
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
      wordCount: 7,
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

  it("returns the expanded projected teaser to a guest", async () => {
    mocks.getFreeOverviewStatus.mockReturnValue({
      status: "ready",
      content: `## Mỏ neo
- **Nội lực: 75/100** — Cung Mệnh tạo nền tảng.

## Điểm đáng chú ý nhất
Đại vận hiện tại tạo ra một điểm chuyển cần đọc tiếp.

## Khí chất và nội lực
NỘI_DUNG_KHÓA_KHÍ_CHẤT

## Công việc và tài chính
NỘI_DUNG_KHÓA_CÔNG_VIỆC

## Cẩm nang hành động
- Hành động đầu tiên.
- Hành động thứ hai.`,
      source: "ai-cache",
      model: "test-model",
      generatedAt: "2026-07-01T00:00:00.000Z",
      wordCount: 80,
      jobStatus: "completed",
    });

    const response = await getOverview();
    const body = await response.json();

    expect(body.content).toContain("## Mỏ neo");
    expect(body.content).toContain("## Khí chất và nội lực");
    expect(body.content).toContain("## Công việc và tài chính");
    expect(body.content).toContain("## Một hành động nên làm ngay");
    expect(body.content).not.toContain("Hành động thứ hai");
    expect(body.wordCount).toBeLessThanOrEqual(500);
  });

  it("returns the complete mini-report to a signed-in user", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", role: "USER" });
    mocks.getFreeOverviewStatus.mockReturnValue({
      status: "ready",
      content: "## Mỏ neo\nBản đầy đủ.\n\n## Công việc và tài chính\nNỘI_DUNG_ĐẦY_ĐỦ",
      source: "ai-cache",
      model: "test-model",
      generatedAt: "2026-07-01T00:00:00.000Z",
      wordCount: 12,
      jobStatus: "completed",
    });

    const response = await getOverview();
    const body = await response.json();

    expect(body.content).toContain("NỘI_DUNG_ĐẦY_ĐỦ");
    expect(body.wordCount).toBe(12);
  });
});
