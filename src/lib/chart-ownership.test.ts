import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionUser } from "@/lib/auth";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));
vi.mock("@/lib/db", () => ({ getDb: mocks.getDb }));

const user: SessionUser = {
  id: "user-1",
  email: "user@example.com",
  name: "Nguoi dung",
  role: "USER",
  coinBalance: 30,
};

describe("guest chart ownership claim", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("claims an unowned chart from a chart next path after login", async () => {
    const db = {
      chart: {
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
    };
    mocks.getDb.mockReturnValue(db);

    const { claimGuestChartForUserFromPath } = await import("@/lib/data");
    await expect(claimGuestChartForUserFromPath("/la-so/chart-1?created=1#mo-khoa-ho-so-vip", user)).resolves.toBe(true);

    expect(db.chart.updateMany).toHaveBeenCalledWith({
      where: { id: "chart-1", userId: null },
      data: { userId: user.id },
    });
  });

  it("does not claim non-chart paths", async () => {
    const db = {
      chart: {
        updateMany: vi.fn(async () => ({ count: 0 })),
      },
    };
    mocks.getDb.mockReturnValue(db);

    const { claimGuestChartForUserFromPath } = await import("@/lib/data");
    await expect(claimGuestChartForUserFromPath("/nap-xu", user)).resolves.toBe(false);

    expect(db.chart.updateMany).not.toHaveBeenCalled();
  });

  it("does not overwrite charts that already belong to another user", async () => {
    const db = {
      chart: {
        updateMany: vi.fn(async () => ({ count: 0 })),
      },
    };
    mocks.getDb.mockReturnValue(db);

    const { claimGuestChartForUserFromPath } = await import("@/lib/data");
    await expect(claimGuestChartForUserFromPath("/la-so/chart-owned", user)).resolves.toBe(false);

    expect(db.chart.updateMany).toHaveBeenCalledWith({
      where: { id: "chart-owned", userId: null },
      data: { userId: user.id },
    });
  });

  it("creates an isolated guest user and atomically claims an unowned chart", async () => {
    const tx = {
      user: {
        create: vi.fn(async ({ data }) => ({
          id: "guest-user-1",
          email: data.email,
          name: data.name,
          role: "USER",
          coinBalance: 0,
        })),
      },
      chart: { updateMany: vi.fn(async () => ({ count: 1 })) },
    };
    const db = {
      $transaction: vi.fn(async (worker: (client: typeof tx) => unknown) => worker(tx)),
    };
    mocks.getDb.mockReturnValue(db);

    const { claimGuestChartForCheckout } = await import("@/lib/data");
    const result = await claimGuestChartForCheckout("chart-1", "Nguyen Minh Anh");

    expect(result).toMatchObject({
      id: "guest-user-1",
      name: "Nguyen Minh Anh",
      role: "USER",
      coinBalance: 0,
    });
    expect(result?.email).toMatch(/^guest-checkout-.+@checkout\.lasotinhhoa\.local$/);
    expect(tx.chart.updateMany).toHaveBeenCalledWith({
      where: { id: "chart-1", userId: null },
      data: { userId: "guest-user-1" },
    });
  });

  it("rolls back the guest identity when another request already claimed the chart", async () => {
    let rolledBack = false;
    const tx = {
      user: {
        create: vi.fn(async ({ data }) => ({
          id: "guest-user-2",
          email: data.email,
          name: data.name,
          role: "USER",
          coinBalance: 0,
        })),
      },
      chart: { updateMany: vi.fn(async () => ({ count: 0 })) },
    };
    const db = {
      $transaction: vi.fn(async (worker: (client: typeof tx) => unknown) => {
        try {
          return await worker(tx);
        } catch (error) {
          rolledBack = true;
          throw error;
        }
      }),
    };
    mocks.getDb.mockReturnValue(db);

    const { claimGuestChartForCheckout } = await import("@/lib/data");
    await expect(claimGuestChartForCheckout("chart-owned", "Nguoi xem")).resolves.toBeNull();
    expect(rolledBack).toBe(true);
  });
});
