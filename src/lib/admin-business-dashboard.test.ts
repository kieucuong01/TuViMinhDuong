import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ getDb: mocks.getDb }));

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

describe("admin business dashboard", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.getDb.mockReset();
  });

  it("summarizes paid revenue, payment sources, and recent registered users", async () => {
    const recentPaidAt = daysAgo(1);
    const olderPaidAt = daysAgo(75);
    const payments = [
      {
        id: "quick-paid",
        orderCode: BigInt(1001),
        amountVnd: 139000,
        coins: 0,
        status: "PAID",
        packageId: null,
        rawPayload: { quickReading: { chartId: "chart-1" } },
        createdAt: recentPaidAt,
        paidAt: recentPaidAt,
        user: { email: "quick@example.com", name: "Quick User" },
      },
      {
        id: "topup-paid",
        orderCode: BigInt(1002),
        amountVnd: 99000,
        coins: 99,
        status: "PAID",
        packageId: "starter",
        rawPayload: null,
        createdAt: recentPaidAt,
        paidAt: recentPaidAt,
        user: { email: "topup@example.com", name: "Topup User" },
      },
      {
        id: "old-paid",
        orderCode: BigInt(1003),
        amountVnd: 499000,
        coins: 559,
        status: "PAID",
        packageId: "pro",
        rawPayload: null,
        createdAt: olderPaidAt,
        paidAt: olderPaidAt,
        user: { email: "old@example.com", name: "Old User" },
      },
      {
        id: "pending",
        orderCode: BigInt(1004),
        amountVnd: 99000,
        coins: 99,
        status: "PENDING",
        packageId: "starter",
        rawPayload: null,
        createdAt: recentPaidAt,
        paidAt: null,
        user: { email: "pending@example.com", name: null },
      },
    ];
    const users = [
      {
        id: "user-1",
        email: "topup@example.com",
        name: "Topup User",
        role: "USER",
        coinBalance: 88,
        createdAt: recentPaidAt,
        _count: { charts: 2, readings: 3, payments: 2 },
        payments: [
          { amountVnd: 99000, status: "PAID", paidAt: recentPaidAt, createdAt: recentPaidAt },
          { amountVnd: 499000, status: "PAID", paidAt: olderPaidAt, createdAt: olderPaidAt },
        ],
      },
    ];
    const db = {
      paymentOrder: {
        findMany: vi.fn(async () => payments),
      },
      user: {
        findMany: vi.fn(async () => users),
      },
    };
    mocks.getDb.mockReturnValue(db);

    const { getAdminBusinessDashboard } = await import("@/lib/data");
    const dashboard = await getAdminBusinessDashboard();

    expect(dashboard.revenue.totalPaidVnd).toBe(737000);
    expect(dashboard.revenue.last30DaysPaidVnd).toBe(238000);
    expect(dashboard.revenue.quickReadingPaidVnd).toBe(139000);
    expect(dashboard.revenue.coinTopupPaidVnd).toBe(598000);
    expect(dashboard.revenue.paidOrders).toBe(3);
    expect(dashboard.revenue.pendingOrders).toBe(1);
    expect(dashboard.recentUsers[0]).toMatchObject({
      email: "topup@example.com",
      chartsCount: 2,
      readingsCount: 3,
      paidOrdersCount: 2,
      totalPaidVnd: 598000,
    });
    expect(dashboard.recentPayments[0]).toMatchObject({
      id: "quick-paid",
      orderCode: "1001",
      source: "quick_reading",
      sourceLabel: "Luận giải nhanh",
    });
  });
});
