import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getReadingJobById: vi.fn(),
  saveReadingProgress: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  },
}));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/data", () => ({
  getReadingJobById: mocks.getReadingJobById,
  saveReadingProgress: mocks.saveReadingProgress,
}));

const validProgress = {
  chapterKey: "chuong-4-cong-viec",
  chapterIndex: 3,
  percent: 42,
  chapterOffset: 0.35,
};

async function putProgress(body: unknown = validProgress) {
  vi.resetModules();
  const { PUT } = await import("./route");
  return PUT(new Request("http://test.local/api/readings/reading-1/progress", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }), {
    params: Promise.resolve({ id: "reading-1" }),
  });
}

describe("paid reading progress route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", role: "USER" });
    mocks.getReadingJobById.mockResolvedValue({
      id: "reading-1",
      userId: "user-1",
      type: "FULL",
      status: "COMPLETED",
      content: "# Reading",
    });
    mocks.saveReadingProgress.mockImplementation(async (userId, readingId, input) => ({
      id: "progress-1",
      userId,
      readingId,
      ...input,
    }));
  });

  it("returns 401 for a guest", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    expect((await putProgress()).status).toBe(401);
    expect(mocks.saveReadingProgress).not.toHaveBeenCalled();
  });

  it("hides a reading not owned by the user", async () => {
    mocks.getReadingJobById.mockResolvedValue(null);
    expect((await putProgress()).status).toBe(404);
  });

  it("rejects a non-completed or non-FULL reading", async () => {
    mocks.getReadingJobById.mockResolvedValue({
      id: "reading-1",
      type: "PALACE",
      status: "COMPLETED",
    });
    expect((await putProgress()).status).toBe(404);
  });

  it("rejects an invalid progress payload", async () => {
    expect((await putProgress({ ...validProgress, percent: 101 })).status).toBe(400);
    expect(mocks.saveReadingProgress).not.toHaveBeenCalled();
  });

  it("upserts valid progress for the owner", async () => {
    const response = await putProgress();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.getReadingJobById).toHaveBeenCalledWith("user-1", "reading-1");
    expect(mocks.saveReadingProgress).toHaveBeenCalledWith("user-1", "reading-1", validProgress);
    expect(body.progress).toMatchObject({ id: "progress-1", percent: 42 });
  });
});
