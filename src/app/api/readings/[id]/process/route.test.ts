import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  revalidatePath: vi.fn(),
  getCurrentUser: vi.fn(),
  generateReadingWithProgress: vi.fn(),
  adjustCoins: vi.fn(),
  completeReadingJob: vi.fn(),
  failReadingJob: vi.fn(),
  getChart: vi.fn(),
  getReadingJobById: vi.fn(),
  updateReadingJobProgress: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  },
  after: mocks.after,
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/ai", () => ({ generateReadingWithProgress: mocks.generateReadingWithProgress }));
vi.mock("@/lib/data", () => ({
  adjustCoins: mocks.adjustCoins,
  completeReadingJob: mocks.completeReadingJob,
  failReadingJob: mocks.failReadingJob,
  getChart: mocks.getChart,
  getReadingJobById: mocks.getReadingJobById,
  updateReadingJobProgress: mocks.updateReadingJobProgress,
}));

async function postProcess(readingId = "reading-1") {
  vi.resetModules();
  const { POST } = await import("./route");
  return POST(new Request(`http://test.local/api/readings/${readingId}/process`, { method: "POST" }), {
    params: Promise.resolve({ id: readingId }),
  });
}

describe("full reading process route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      name: "Nguoi dung",
      role: "USER",
      coinBalance: 0,
    });
    mocks.getReadingJobById.mockResolvedValue({
      id: "reading-1",
      userId: "user-1",
      chartId: "chart-1",
      type: "FULL",
      scopeKey: "all",
      status: "PENDING",
      priceCoins: 199,
      content: "",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });
    mocks.getChart.mockResolvedValue({
      id: "chart-1",
      chart: { input: { fullName: "Test User", viewYear: 2026 }, palaces: [], summary: [] },
    });
    mocks.generateReadingWithProgress.mockResolvedValue({
      content: "# Full reading",
      model: "test-model",
      prompt: JSON.stringify({ promptVersion: "test" }),
    });
  });

  it("returns 202 immediately and schedules the long generation after the response", async () => {
    const response = await postProcess();
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toEqual({ status: "processing", readingId: "reading-1" });
    expect(mocks.after).toHaveBeenCalledTimes(1);
    expect(mocks.generateReadingWithProgress).not.toHaveBeenCalled();

    await mocks.after.mock.calls[0][0]();

    expect(mocks.generateReadingWithProgress).toHaveBeenCalledTimes(1);
    expect(mocks.completeReadingJob).toHaveBeenCalledWith(
      "reading-1",
      "# Full reading",
      expect.objectContaining({ phase: "completed" }),
      "test-model",
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/la-so/chart-1/nang-cao");
  });
});
