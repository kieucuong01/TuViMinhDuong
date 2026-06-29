import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  answerChartQuestion: vi.fn(),
  getChart: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/data", () => ({ getChart: mocks.getChart }));
vi.mock("@/lib/chart-assistant", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/chart-assistant")>();
  return { ...actual, answerChartQuestion: mocks.answerChartQuestion };
});

import { ChartAssistantError } from "@/lib/chart-assistant";
import { POST } from "@/app/api/assistant/route";

function request(body: unknown) {
  return new Request("http://localhost/api/assistant", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const user = {
  id: "user-1",
  email: "reader@example.com",
  name: "Reader",
  role: "USER" as const,
  coinBalance: 0,
};

describe("POST /api/assistant", () => {
  beforeEach(() => {
    mocks.getCurrentUser.mockReset();
    mocks.answerChartQuestion.mockReset();
  });

  it("requires authentication", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const response = await POST(request({ chartId: "chart-1", question: "Tài chính thế nào?" }));

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: expect.any(String), action: "login" });
    expect(mocks.answerChartQuestion).not.toHaveBeenCalled();
  });

  it.each([
    ["FULL_REQUIRED", 403, "unlock-full"],
    ["NOT_FOUND", 404, undefined],
    ["QUOTA_EXHAUSTED", 409, undefined],
  ] as const)("maps %s to the public API contract", async (code, status, action) => {
    mocks.getCurrentUser.mockResolvedValue(user);
    mocks.answerChartQuestion.mockRejectedValue(new ChartAssistantError(code));

    const response = await POST(request({ chartId: "chart-1", question: "Tôi nên ưu tiên gì?" }));
    const payload = await response.json();

    expect(response.status).toBe(status);
    expect(payload.error).toEqual(expect.any(String));
    if (action) expect(payload.action).toBe(action);
  });

  it("returns the persisted answer, history, and remaining quota", async () => {
    mocks.getCurrentUser.mockResolvedValue(user);
    mocks.answerChartQuestion.mockResolvedValue({
      answer: "Giữ quỹ dự phòng.",
      model: "deepseek/deepseek-v4-flash",
      remaining: 2,
      history: [{ id: "q1", slot: 1, question: "Hỏi", answer: "Đáp", model: "deepseek/test" }],
    });

    const response = await POST(request({ chartId: "chart-1", question: "Tài chính năm nay?" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      answer: "Giữ quỹ dự phòng.",
      remaining: 2,
      history: [{ slot: 1 }],
    });
    expect(mocks.answerChartQuestion).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ user, chartId: "chart-1", question: "Tài chính năm nay?" }),
    );
  });
});
