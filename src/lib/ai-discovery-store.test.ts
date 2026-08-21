import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDb: mocks.getDb }));

import { recordAiDiscoveryResponse } from "./ai-discovery-store";

const chartId = "cm9gq4t4a0001w1a2b3c4d5e6";
const submission = { chartId, source: "ai" as const, aiPlatform: "chatgpt" as const, prompt: "web lập lá số nào tốt?" };

function dbWithChart(chart: unknown) {
  return {
    chart: { findUnique: vi.fn().mockResolvedValue(chart) },
    aiDiscoveryResponse: { upsert: vi.fn().mockResolvedValue({ id: "response-1" }) },
  };
}

describe("recordAiDiscoveryResponse", () => {
  beforeEach(() => mocks.getDb.mockReset());

  it("allows the original guest funnel session and persists only the first response", async () => {
    const db = dbWithChart({ userId: null, creationAttribution: { funnelSessionId: "session-1" } });
    mocks.getDb.mockReturnValue(db);

    await expect(recordAiDiscoveryResponse({ submission, funnelSessionId: "session-1" })).resolves.toBe("saved");
    expect(db.aiDiscoveryResponse.upsert).toHaveBeenCalledWith({
      where: { chartId },
      create: { chartId, source: "ai", aiPlatform: "chatgpt", prompt: "web lập lá số nào tốt?" },
      update: {},
    });
  });

  it("allows the chart owner even when the guest session changes", async () => {
    const db = dbWithChart({ userId: "user-1", creationAttribution: { funnelSessionId: "old-session" } });
    mocks.getDb.mockReturnValue(db);

    await expect(recordAiDiscoveryResponse({ submission, userId: "user-1", funnelSessionId: "new-session" })).resolves.toBe("saved");
  });

  it("rejects callers that own neither chart nor original funnel session", async () => {
    const db = dbWithChart({ userId: "user-1", creationAttribution: { funnelSessionId: "session-1" } });
    mocks.getDb.mockReturnValue(db);

    await expect(recordAiDiscoveryResponse({ submission, userId: "user-2", funnelSessionId: "session-2" })).resolves.toBe("forbidden");
    expect(db.aiDiscoveryResponse.upsert).not.toHaveBeenCalled();
  });

  it("does not claim to save when the database is not configured", async () => {
    mocks.getDb.mockReturnValue(null);

    await expect(recordAiDiscoveryResponse({ submission, funnelSessionId: "session-1" })).resolves.toBe("unavailable");
  });
});
