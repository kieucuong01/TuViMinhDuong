import { describe, expect, it, vi } from "vitest";
import {
  buildPendingPaymentAgeBuckets,
  classifyPayOSReconciliation,
  parsePaymentReconciliationArgs,
  reconcileStalePaymentOrders,
  type PendingPaymentOrder,
  type PayOSReconciliationPayment,
} from "@/lib/payment-reconciliation";

const now = new Date("2026-08-05T12:00:00.000Z");

function order(overrides: Partial<PendingPaymentOrder> = {}): PendingPaymentOrder {
  return {
    id: "payment-1",
    orderCode: 123n,
    amountVnd: 199_000,
    status: "PENDING",
    createdAt: new Date("2026-08-03T12:00:00.000Z"),
    ...overrides,
  };
}

function provider(overrides: Partial<PayOSReconciliationPayment> = {}): PayOSReconciliationPayment {
  return {
    orderCode: 123n,
    amount: 199_000,
    amountPaid: 0,
    status: "CANCELLED",
    raw: { code: "00" },
    ...overrides,
  };
}

describe("classifyPayOSReconciliation", () => {
  it.each(["CANCELLED", "EXPIRED", "FAILED"] as const)(
    "accepts provider-confirmed %s as an unpaid terminal update",
    (status) => {
      expect(classifyPayOSReconciliation(order(), provider({ status }))).toEqual({
        kind: "update",
        status,
      });
    },
  );

  it.each(["PENDING", "PROCESSING"])("leaves provider %s unchanged", (status) => {
    expect(classifyPayOSReconciliation(order(), provider({ status }))).toEqual({ kind: "unchanged" });
  });

  it("reports verified paid evidence but never returns a paid update", () => {
    expect(classifyPayOSReconciliation(order(), provider({ status: "PAID", amountPaid: 199_000 }))).toEqual({
      kind: "paid_observed",
    });
  });

  it("rejects mismatched order codes, amounts, and incomplete paid evidence", () => {
    expect(classifyPayOSReconciliation(order(), provider({ orderCode: 999n }))).toEqual({ kind: "mismatch" });
    expect(classifyPayOSReconciliation(order(), provider({ amount: 99_000 }))).toEqual({ kind: "mismatch" });
    expect(classifyPayOSReconciliation(order(), provider({ status: "PAID", amountPaid: 198_999 }))).toEqual({ kind: "mismatch" });
  });
});

describe("reconcileStalePaymentOrders", () => {
  function db(pendingOrders = [order()]) {
    return {
      paymentOrder: {
        findMany: vi.fn().mockResolvedValue(pendingOrders),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      paymentReconciliationRun: {
        create: vi.fn().mockResolvedValue({ id: "run-1" }),
      },
    };
  }

  it("is dry-run by default and performs no writes", async () => {
    const client = db();
    const result = await reconcileStalePaymentOrders({
      db: client,
      now,
      olderThanHours: 24,
      limit: 50,
      fetchPaymentRequest: vi.fn().mockResolvedValue(provider()),
    });

    expect(result).toMatchObject({ dryRun: true, scanned: 1, cancelled: 1, updated: 0 });
    expect(client.paymentOrder.updateMany).not.toHaveBeenCalled();
    expect(client.paymentReconciliationRun.create).not.toHaveBeenCalled();
  });

  it("applies only a conditional pending-to-terminal update and records the run", async () => {
    const client = db();
    const result = await reconcileStalePaymentOrders({
      db: client,
      now,
      dryRun: false,
      olderThanHours: 24,
      limit: 50,
      fetchPaymentRequest: vi.fn().mockResolvedValue(provider()),
    });

    expect(client.paymentOrder.updateMany).toHaveBeenCalledWith({
      where: { id: "payment-1", status: "PENDING" },
      data: expect.objectContaining({ status: "CANCELLED" }),
    });
    expect(result).toMatchObject({ cancelled: 1, updated: 1 });
    expect(client.paymentReconciliationRun.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ dryRun: false, scanned: 1, updated: 1, cancelled: 1 }),
    });
  });

  it("does not overwrite an order settled concurrently", async () => {
    const client = db();
    client.paymentOrder.updateMany.mockResolvedValue({ count: 0 });
    const result = await reconcileStalePaymentOrders({
      db: client,
      now,
      dryRun: false,
      olderThanHours: 24,
      limit: 50,
      fetchPaymentRequest: vi.fn().mockResolvedValue(provider()),
    });

    expect(result).toMatchObject({ cancelled: 1, updated: 0, concurrentChanges: 1 });
  });

  it("retries provider failures and records one exhausted error", async () => {
    const client = db();
    const fetchPaymentRequest = vi.fn()
      .mockRejectedValueOnce(new Error("429"))
      .mockRejectedValueOnce(new Error("timeout"))
      .mockRejectedValueOnce(new Error("still unavailable"));
    const result = await reconcileStalePaymentOrders({
      db: client,
      now,
      dryRun: false,
      olderThanHours: 24,
      limit: 50,
      retries: 2,
      retryDelay: vi.fn().mockResolvedValue(undefined),
      fetchPaymentRequest,
    });

    expect(fetchPaymentRequest).toHaveBeenCalledTimes(3);
    expect(result).toMatchObject({ providerErrors: 1, updated: 0 });
    expect(client.paymentOrder.updateMany).not.toHaveBeenCalled();
  });
});

describe("buildPendingPaymentAgeBuckets", () => {
  it("groups pending orders into useful admin age bands", () => {
    const buckets = buildPendingPaymentAgeBuckets([
      order({ id: "new", amountVnd: 10_000, createdAt: new Date("2026-08-05T06:00:00.000Z") }),
      order({ id: "stale", amountVnd: 20_000, createdAt: new Date("2026-08-04T06:00:00.000Z") }),
      order({ id: "old", amountVnd: 30_000, createdAt: new Date("2026-08-01T06:00:00.000Z") }),
      order({ id: "paid", status: "PAID", amountVnd: 999_000 }),
    ], now);

    expect(buckets).toEqual([
      { key: "under_24h", label: "Dưới 24 giờ", count: 1, amountVnd: 10_000 },
      { key: "24_to_72h", label: "24-72 giờ", count: 1, amountVnd: 20_000 },
      { key: "over_72h", label: "Trên 72 giờ", count: 1, amountVnd: 30_000 },
    ]);
  });
});

describe("parsePaymentReconciliationArgs", () => {
  it("requires an explicit apply flag and clamps operational bounds", () => {
    expect(parsePaymentReconciliationArgs([])).toEqual({ dryRun: true, olderThanHours: 24, limit: 100 });
    expect(parsePaymentReconciliationArgs(["--apply", "--older-than-hours=0", "--limit=9000"])).toEqual({
      dryRun: false,
      olderThanHours: 1,
      limit: 500,
    });
  });
});
