import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

vi.mock("server-only", () => ({}));

const user = {
  id: "user-1",
  email: "buyer@example.com",
  name: "Nguyễn Văn A",
  role: "USER" as const,
  coinBalance: 0,
};

const record = {
  id: "chart-1",
  userId: user.id,
  chart: { input: { fullName: user.name } },
};

function fullDeps(overrides: Record<string, unknown> = {}) {
  const paymentCreate = vi.fn(async () => ({ id: "order-1" }));
  return {
    getDb: () => ({ paymentOrder: { create: paymentCreate } }),
    getCachedReading: vi.fn(async () => null),
    getReadingJobByScope: vi.fn(async () => null),
    getFeaturePrice: vi.fn(async () => ({ label: "Luận giải trọn đời", priceCoins: 99 })),
    retryPaidFullReading: vi.fn(async () => null),
    createPayOSCustomCheckout: vi.fn(async () => ({
      orderCode: 123456,
      paymentLinkId: "link-1",
      checkoutUrl: "https://pay.example/checkout",
      raw: {},
    })),
    createPendingReading: vi.fn(async () => ({ id: "reading-demo" })),
    completePaidReadingOrder: vi.fn(async () => ({ readingId: "reading-settled" })),
    paymentCreate,
    ...overrides,
  };
}

const fullInput = {
  record,
  user,
  chartId: record.id,
  buyerEmail: user.email,
  requiresCheckoutEmail: false,
  getReturnToken: async () => null,
};

describe("full reading checkout orchestration", () => {
  it("returns cached and pending readings without creating checkout", async () => {
    const { runFullReadingCheckout } = await import("@/lib/reading-checkout");
    const cachedDeps = fullDeps({ getCachedReading: vi.fn(async () => ({ id: "cached-1" })) });
    await expect(runFullReadingCheckout(cachedDeps as never, fullInput as never)).resolves.toEqual({
      status: "cached",
      location: "/la-so/chart-1/nang-cao?reading=cached-1",
    });
    expect(cachedDeps.createPayOSCustomCheckout).not.toHaveBeenCalled();

    const pendingDeps = fullDeps({ getReadingJobByScope: vi.fn(async () => ({ id: "pending-1", status: "PENDING" })) });
    await expect(runFullReadingCheckout(pendingDeps as never, fullInput as never)).resolves.toEqual({
      status: "pending",
      location: "/la-so/chart-1/nang-cao?reading=pending-1&generating=1",
    });
  });

  it("retries a paid failed reading before creating another order", async () => {
    const { runFullReadingCheckout } = await import("@/lib/reading-checkout");
    const deps = fullDeps({
      getReadingJobByScope: vi.fn(async () => ({ id: "failed-1", status: "FAILED" })),
      retryPaidFullReading: vi.fn(async () => ({ readingId: "retry-1" })),
    });

    await expect(runFullReadingCheckout(deps as never, fullInput as never)).resolves.toEqual({
      status: "retrying",
      location: "/la-so/chart-1/nang-cao?reading=retry-1&generating=1",
    });
    expect(deps.createPayOSCustomCheckout).not.toHaveBeenCalled();
  });

  it("rejects forbidden ownership and an invalid checkout email", async () => {
    const { runFullReadingCheckout } = await import("@/lib/reading-checkout");
    await expect(runFullReadingCheckout(fullDeps() as never, {
      ...fullInput,
      record: { ...record, userId: "someone-else" },
    } as never)).resolves.toEqual({ status: "error", code: "forbidden" });

    await expect(runFullReadingCheckout(fullDeps() as never, {
      ...fullInput,
      buyerEmail: null,
    } as never)).resolves.toEqual({ status: "error", code: "email-invalid" });
  });

  it("maps PayOS creation errors and unavailable non-demo checkout", async () => {
    const { runFullReadingCheckout } = await import("@/lib/reading-checkout");
    const failed = fullDeps({ createPayOSCustomCheckout: vi.fn(async () => { throw new Error("provider down"); }) });
    await expect(runFullReadingCheckout(failed as never, fullInput as never)).resolves.toEqual({
      status: "error",
      code: "checkout-error",
    });

    const unavailable = fullDeps({ getDb: () => null });
    await expect(runFullReadingCheckout(unavailable as never, fullInput as never)).resolves.toEqual({
      status: "error",
      code: "unavailable",
    });
  });

  it("creates the local demo reading or an external payment order", async () => {
    const { runFullReadingCheckout } = await import("@/lib/reading-checkout");
    const local = fullDeps({
      getDb: () => null,
      createPayOSCustomCheckout: vi.fn(async () => ({
        orderCode: 456,
        paymentLinkId: "demo-link",
        checkoutUrl: "https://demo.invalid",
        raw: { mode: "demo" },
      })),
    });
    await expect(runFullReadingCheckout(local as never, fullInput as never)).resolves.toEqual({
      status: "demo-paid",
      location: "/la-so/chart-1/nang-cao?reading=reading-demo&generating=1&status=demo-paid&orderCode=456",
    });

    const external = fullDeps();
    await expect(runFullReadingCheckout(external as never, fullInput as never)).resolves.toEqual({
      status: "external",
      location: "https://pay.example/checkout",
    });
    expect(external.paymentCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: user.id,
        amountVnd: 99000,
        rawPayload: expect.objectContaining({
          directReading: expect.objectContaining({ chartId: "chart-1", checkoutEmail: user.email }),
        }),
      }),
    }));
  });
});

describe("quick reading checkout orchestration", () => {
  it("stores a local completed reading and returns its revalidation path", async () => {
    const { runQuickReadingCheckout } = await import("@/lib/reading-checkout");
    const saveReading = vi.fn(async () => ({ id: "quick-1" }));
    const result = await runQuickReadingCheckout({
      getDb: () => null,
      createPayOSCustomCheckout: vi.fn(async () => ({
        orderCode: 789,
        paymentLinkId: "demo-link",
        checkoutUrl: "https://demo.invalid",
        raw: { mode: "demo" },
      })),
      isPayOSEnabled: () => false,
      generateReading: vi.fn(async () => ({ content: "Nội dung", model: "demo-model" })),
      saveReading,
    } as never, {
      user,
      chart: record,
      token: "magic-token",
      price: { label: "Luận giải", priceCoins: 99 },
    } as never);

    expect(result).toEqual({
      status: "demo-paid",
      location: "/la-so/chart-1/nang-cao?status=demo-paid",
      revalidatePath: "/la-so/chart-1",
    });
    expect(saveReading).toHaveBeenCalled();
  });
});

describe("coin top-up checkout orchestration", () => {
  it("credits a local demo checkout without writing a payment order", async () => {
    const { runCoinTopupCheckout } = await import("@/lib/reading-checkout");
    const adjustCoins = vi.fn(async () => 200);
    const result = await runCoinTopupCheckout({
      getDb: () => null,
      createPayOSCheckout: vi.fn(async () => ({
        orderCode: 999,
        paymentLinkId: "demo-link",
        checkoutUrl: "https://demo.invalid",
        amountVnd: 49000,
        coins: 50,
        raw: { mode: "demo" },
      })),
      adjustCoins,
    } as never, {
      user,
      packageKey: "full-reading",
      pack: { key: "full-reading", label: "Gói", coins: 50, bonusCoins: 0, priceVnd: 49000 },
      returnTo: "/nap-xu?adPackage=full-reading",
    } as never);

    expect(result).toEqual({
      status: "demo-paid",
      location: "/nap-xu?adPackage=full-reading&status=demo-paid&orderCode=999",
    });
    expect(adjustCoins).toHaveBeenCalledWith(user, 50, "Demo nạp xu", "999");
  });
});

describe("server action checkout boundary", () => {
  it("keeps authorization and navigation in the action without direct payment writes", () => {
    const source = readFileSync(fileURLToPath(new URL("../app/actions.ts", import.meta.url)), "utf8");
    expect(source).toContain("getCurrentUser()");
    expect(source).toContain("redirect(checkout.location)");
    expect(source).not.toContain("db.paymentOrder.create");
    expect(source.split(/\r?\n/).filter((line) => line.trim()).length).toBeLessThan(560);
  });
});
