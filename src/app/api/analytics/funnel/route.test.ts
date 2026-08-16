import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  recordFunnelEventBestEffort: vi.fn(),
  checkRateLimit: vi.fn(),
  rateLimitKeyFromHeaders: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/funnel-events", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/funnel-events")>()),
  recordFunnelEventBestEffort: mocks.recordFunnelEventBestEffort,
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  rateLimitKeyFromHeaders: mocks.rateLimitKeyFromHeaders,
}));

import { POST } from "./route";

const body = {
  name: "tool_view",
  eventId: "119fc7f3-d19c-73c0-946d-cd7a275f8906",
  anonymousSessionId: "019fc7f3-d19c-73c0-946d-cd7a275f8906",
  source: "ai",
  landingClass: "wealth_tool",
  tool: "wealth",
  placement: "wealth_landing_form",
};

function request(value: unknown = body, headers?: Record<string, string>) {
  return new Request("https://lasotinhhoa.vn/api/analytics/funnel", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://lasotinhhoa.vn", ...headers },
    body: JSON.stringify(value),
  });
}

describe("POST /api/analytics/funnel", () => {
  beforeEach(() => {
    mocks.getCurrentUser.mockReset().mockResolvedValue(null);
    mocks.recordFunnelEventBestEffort.mockReset().mockResolvedValue({ id: "event-1" });
    mocks.checkRateLimit.mockReset().mockReturnValue({ rateLimited: false, remaining: 59, resetAt: new Date() });
    mocks.rateLimitKeyFromHeaders.mockReset().mockReturnValue("analytics:funnel:203.0.113.10");
  });

  it("binds identity on the server and accepts a privacy-safe early stage", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", role: "USER" });

    const response = await POST(request());

    expect(response.status).toBe(202);
    expect(mocks.recordFunnelEventBestEffort).toHaveBeenCalledWith({
      name: "tool_view",
      anonymousSessionId: body.anonymousSessionId,
      userId: "user-1",
      source: "ai",
      landingClass: "wealth_tool",
      tool: "wealth",
      placement: "wealth_landing_form",
      resultBand: undefined,
      dedupeKey: `client:${body.anonymousSessionId}:${body.eventId}`,
    });
  });

  it.each([
    { ...body, email: "person@example.com" },
    { ...body, chartId: "chart-1" },
    { ...body, name: "paid" },
    { ...body, landingPath: "/private?birth=1990" },
  ])("rejects forbidden or trusted-only input %#", async (value) => {
    const response = await POST(request(value));

    expect(response.status).toBe(400);
    expect(mocks.recordFunnelEventBestEffort).not.toHaveBeenCalled();
  });

  it("accepts same public origin when Next.js sees the internal proxy URL", async () => {
    const proxied = new Request("http://127.0.0.1:4100/api/analytics/funnel", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://lasotinhhoa.vn",
        "x-forwarded-host": "lasotinhhoa.vn",
        "x-forwarded-proto": "https",
      },
      body: JSON.stringify(body),
    });

    const response = await POST(proxied);

    expect(response.status).toBe(202);
    expect(mocks.recordFunnelEventBestEffort).toHaveBeenCalled();
  });

  it("rejects explicit cross-origin requests", async () => {
    const response = await POST(request(body, { origin: "https://evil.example" }));

    expect(response.status).toBe(403);
  });

  it("rate limits abusive clients", async () => {
    mocks.checkRateLimit.mockReturnValue({ rateLimited: true, remaining: 0, resetAt: new Date() });

    const response = await POST(request());

    expect(response.status).toBe(429);
    expect(mocks.recordFunnelEventBestEffort).not.toHaveBeenCalled();
  });

  it("does not block the product when the best-effort sink is unavailable", async () => {
    mocks.recordFunnelEventBestEffort.mockResolvedValue(null);

    const response = await POST(request());

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ accepted: true });
  });
});
