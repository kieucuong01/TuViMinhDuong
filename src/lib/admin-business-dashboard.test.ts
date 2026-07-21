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

  it("summarizes report overview metrics and daily trends", async () => {
    const recentDate = daysAgo(1);
    const oldDate = daysAgo(30);
    const users = [{ createdAt: oldDate }, { createdAt: recentDate }];
    const charts = [
      { userId: "user-1", createdAt: oldDate },
      { userId: null, createdAt: recentDate },
      { userId: "user-2", createdAt: recentDate },
    ];
    const readings = [{ status: "COMPLETED" }, { status: "PENDING" }];
    const articles = [
      { slug: "published", status: "published", robots: "index,follow", canonicalUrl: "/kien-thuc-tu-vi/published" },
      { slug: "hidden", status: "published", robots: "noindex,follow", canonicalUrl: "/kien-thuc-tu-vi/hidden" },
    ];

    function countByCreatedAt(rows: Array<{ createdAt: Date }>, args?: { where?: { createdAt?: { lt?: Date; gte?: Date } } }) {
      const range = args?.where?.createdAt;
      if (!range) return rows.length;
      return rows.filter((row) => {
        if (range.lt && !(row.createdAt < range.lt)) return false;
        if (range.gte && !(row.createdAt >= range.gte)) return false;
        return true;
      }).length;
    }

    const db = {
      $queryRaw: vi.fn(async () => []),
      featurePrice: { findMany: vi.fn(async () => []) },
      user: { count: vi.fn(async (args) => countByCreatedAt(users, args)) },
      chart: {
        count: vi.fn(async (args) => {
          if (args?.where?.userId === null) return charts.filter((chart) => chart.userId === null).length;
          return countByCreatedAt(charts, args);
        }),
      },
      reading: {
        count: vi.fn(async (args) => args?.where?.status === "COMPLETED"
          ? readings.filter((reading) => reading.status === "COMPLETED").length
          : readings.length),
      },
      article: {
        count: vi.fn(async () => articles.length),
        findMany: vi.fn(async () => articles),
      },
      pseoPage: { count: vi.fn(async () => 5) },
      paymentOrder: { count: vi.fn(async () => 4) },
      coinPackage: { findMany: vi.fn(async () => []) },
    };
    mocks.getDb.mockReturnValue(db);

    const { getAdminOverview } = await import("@/lib/data");
    const overview = await getAdminOverview("day");
    const trendTotals = overview.trends.reduce((sum, point) => ({
      newUsers: sum.newUsers + point.newUsers,
      charts: sum.charts + point.charts,
    }), { newUsers: 0, charts: 0 });

    expect(overview.users).toBe(2);
    expect(overview.charts).toBe(3);
    expect(overview.unlockedReadings).toBe(1);
    expect(overview.seoArticles).toBe(2);
    expect(overview.pseoArticles).toBe(37);
    expect(overview.guestCharts).toBe(1);
    expect(overview.guestChartRate).toBe(33.3);
    expect(overview.sitemapFiles).toBe(16);
    expect(overview.sitemapMainUrls).toBe(21);
    expect(overview.trendPeriod).toBe("day");
    expect(overview.trends).toHaveLength(14);
    expect(overview.trendGroups.day).toHaveLength(14);
    expect(overview.trendGroups.week).toHaveLength(12);
    expect(overview.trendGroups.month).toHaveLength(12);
    expect(overview.trends).toBe(overview.trendGroups.day);
    expect(trendTotals.newUsers).toBe(1);
    expect(trendTotals.charts).toBe(2);
  });
});
