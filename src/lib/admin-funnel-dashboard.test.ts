import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ getDb: mocks.getDb }));

describe("admin funnel dashboard data", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.getDb.mockReset();
  });

  it("reads only the bounded funnel window and pending payment fields", async () => {
    const funnelFindMany = vi.fn(async () => []);
    const paymentFindMany = vi.fn(async () => []);
    mocks.getDb.mockReturnValue({
      funnelEvent: { findMany: funnelFindMany },
      paymentOrder: { findMany: paymentFindMany },
    });

    const { getAdminFunnelDashboard } = await import("@/lib/data");
    const dashboard = await getAdminFunnelDashboard();

    expect(dashboard.windows[7].stages).toHaveLength(9);
    expect(funnelFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { createdAt: { gte: expect.any(Date) } },
      select: {
        id: true,
        name: true,
        anonymousSessionId: true,
        userId: true,
        source: true,
        tool: true,
        createdAt: true,
      },
    }));
    expect(paymentFindMany).toHaveBeenCalledWith({
      where: { status: "PENDING" },
      select: { status: true, amountVnd: true, createdAt: true },
    });
  });

  it("returns an empty but renderable dashboard without a database", async () => {
    mocks.getDb.mockReturnValue(null);
    const { getAdminFunnelDashboard } = await import("@/lib/data");
    const dashboard = await getAdminFunnelDashboard();

    expect(dashboard.windows[28].stages.every((stage) => stage.actors === 0)).toBe(true);
    expect(dashboard.stalePendingOrders).toBe(0);
  });
});
