import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getServerFunnelSessionId: vi.fn(),
  checkRateLimit: vi.fn(),
  rateLimitKeyFromHeaders: vi.fn(),
  recordAiDiscoveryResponse: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/funnel-events", () => ({ getServerFunnelSessionId: mocks.getServerFunnelSessionId }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  rateLimitKeyFromHeaders: mocks.rateLimitKeyFromHeaders,
}));
vi.mock("@/lib/ai-discovery-store", () => ({ recordAiDiscoveryResponse: mocks.recordAiDiscoveryResponse }));

import { POST } from "./route";

const chartId = "cm9gq4t4a0001w1a2b3c4d5e6";
const funnelSessionId = "019fc7f3-d19c-73c0-946d-cd7a275f8906";
const body = {
  chartId,
  source: "ai",
  aiPlatform: "chatgpt",
  prompt: "web lập lá số tử vi miễn phí nào dễ hiểu?",
};

function request(value: unknown = body, headers?: Record<string, string>) {
  return new Request("https://lasotinhhoa.vn/api/analytics/ai-discovery", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://lasotinhhoa.vn", ...headers },
    body: JSON.stringify(value),
  });
}

describe("POST /api/analytics/ai-discovery", () => {
  beforeEach(() => {
    mocks.getCurrentUser.mockReset().mockResolvedValue(null);
    mocks.getServerFunnelSessionId.mockReset().mockResolvedValue(funnelSessionId);
    mocks.checkRateLimit.mockReset().mockReturnValue({ rateLimited: false, remaining: 5, resetAt: new Date() });
    mocks.rateLimitKeyFromHeaders.mockReset().mockReturnValue("analytics:ai-discovery:203.0.113.10");
    mocks.recordAiDiscoveryResponse.mockReset().mockResolvedValue("saved");
  });

  it("records a valid optional AI prompt with server-side identity", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", role: "USER" });

    const response = await POST(request());

    expect(response.status).toBe(202);
    expect(mocks.recordAiDiscoveryResponse).toHaveBeenCalledWith({
      submission: body,
      userId: "user-1",
      funnelSessionId,
    });
  });

  it.each([
    { ...body, prompt: "sinh ngày 12/02/1990" },
    { ...body, extra: "nope" },
    { chartId, source: "youtube", prompt: "không được nhận" },
  ])("rejects invalid or privacy-unsafe input %#", async (value) => {
    const response = await POST(request(value));

    expect(response.status).toBe(400);
    expect(mocks.recordAiDiscoveryResponse).not.toHaveBeenCalled();
  });

  it("does not allow a cross-origin write", async () => {
    const response = await POST(request(body, { origin: "https://evil.example" }));

    expect(response.status).toBe(403);
    expect(mocks.recordAiDiscoveryResponse).not.toHaveBeenCalled();
  });

  it("rate limits collection without affecting chart creation", async () => {
    mocks.checkRateLimit.mockReturnValue({ rateLimited: true, remaining: 0, resetAt: new Date() });

    const response = await POST(request());

    expect(response.status).toBe(429);
    expect(mocks.recordAiDiscoveryResponse).not.toHaveBeenCalled();
  });

  it("returns forbidden when the caller does not own the chart/session", async () => {
    mocks.recordAiDiscoveryResponse.mockResolvedValue("forbidden");

    const response = await POST(request());

    expect(response.status).toBe(403);
  });
});
