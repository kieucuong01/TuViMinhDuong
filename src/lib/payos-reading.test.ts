import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ APP_URL: "https://example.test", isPayOSEnabled: () => true }));

import { completePaidReadingOrder, paidReadingOrderPayload, retryPaidFullReading } from "@/lib/payos";

describe("direct paid reading settlement", () => {
  it("recognizes direct and legacy quick FULL metadata but not topups", () => {
    expect(paidReadingOrderPayload({
      directReading: { chartId: "chart-1", type: "FULL", scopeKey: "all" },
    })).toMatchObject({ kind: "directReading", chartId: "chart-1" });
    expect(paidReadingOrderPayload({
      quickReading: { chartId: "chart-2", type: "FULL", scopeKey: "all", token: "legacy" },
    })).toMatchObject({ kind: "quickReading", chartId: "chart-2" });
    expect(paidReadingOrderPayload({ packageKey: "full-reading" })).toBeNull();
  });

  describe("idempotency", () => {
    const freshOrder = {
      id: "order-1",
      userId: "user-1",
      orderCode: BigInt(123),
      amountVnd: 199000,
      coins: 0,
      status: "PENDING",
      paidAt: null,
      rawPayload: {
        directReading: { chartId: "chart-1", type: "FULL", scopeKey: "all" },
      },
    };
    const reading = { id: "reading-1", status: "PENDING" };
    const tx = {
      paymentOrder: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      reading: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      user: { update: vi.fn() },
      coinLedger: { create: vi.fn() },
    };
    const db = {
      $transaction: vi.fn(async (worker: (client: typeof tx) => unknown) => worker(tx)),
    };

    beforeEach(() => {
      vi.clearAllMocks();
      tx.paymentOrder.findUnique.mockResolvedValue(freshOrder);
      tx.reading.findUnique.mockResolvedValueOnce(null).mockResolvedValue(reading);
      tx.reading.create.mockResolvedValue(reading);
      tx.paymentOrder.update.mockResolvedValue({ ...freshOrder, status: "PAID" });
    });

    it("creates exactly one PENDING reading and never credits or debits coins", async () => {
      const order = { ...freshOrder, rawPayload: freshOrder.rawPayload };
      const first = await completePaidReadingOrder(db as never, order, { webhook: 1 });
      const second = await completePaidReadingOrder(db as never, order, { webhook: 2 });

      expect(first).toMatchObject({ readingId: "reading-1", chartId: "chart-1", purchaseType: "direct_full" });
      expect(second).toMatchObject({ readingId: "reading-1" });
      expect(tx.reading.create).toHaveBeenCalledTimes(1);
      expect(tx.reading.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: "PENDING",
          priceCoins: 0,
          content: null,
          promptMeta: expect.objectContaining({ source: "direct-full-checkout", paymentOrderId: "order-1" }),
        }),
      });
      expect(tx.user.update).not.toHaveBeenCalled();
      expect(tx.coinLedger.create).not.toHaveBeenCalled();
    });

    it.each(["FAILED", "REFUNDED"] as const)(
      "requeues an existing %s reading with the fresh paid-order entitlement",
      async (status) => {
        const existingReading = {
          id: "reading-1",
          status,
          priceCoins: 199,
          content: "stale partial content",
          error: "previous attempt failed",
          promptMeta: { source: "previous-payment", paymentOrderId: "old-order", progress: { completed: 2 } },
        };
        tx.reading.findUnique.mockReset().mockResolvedValue(existingReading);
        tx.reading.update.mockResolvedValue({ ...existingReading, status: "PENDING" });

        await completePaidReadingOrder(db as never, freshOrder, { webhook: status });

        expect(tx.reading.create).not.toHaveBeenCalled();
        expect(tx.reading.update).toHaveBeenCalledWith({
          where: { id: "reading-1" },
          data: {
            status: "PENDING",
            priceCoins: 0,
            content: null,
            error: null,
            promptMeta: expect.objectContaining({
              source: "previous-payment",
              paymentOrderId: "order-1",
              progress: { completed: 2 },
            }),
          },
        });
      },
    );
  });

  describe("paid FULL retry entitlement", () => {
    const paidAt = new Date("2026-07-19T00:00:00Z");
    const order = {
      id: "order-1",
      userId: "user-1",
      orderCode: BigInt(123),
      amountVnd: 199000,
      coins: 0,
      status: "PAID",
      paidAt,
      rawPayload: {
        directReading: { chartId: "chart-1", type: "FULL", scopeKey: "all" },
      },
    };
    const failedReading = {
      id: "reading-1",
      userId: "user-1",
      chartId: "chart-1",
      type: "FULL" as const,
      scopeKey: "all" as const,
      status: "FAILED" as const,
      promptMeta: { paymentOrderId: "order-1" },
    };

    function retryDb(foundOrder: typeof order | null = order) {
      const tx = {
        paymentOrder: {
          findUnique: vi.fn().mockResolvedValue(foundOrder),
          update: vi.fn().mockResolvedValue(foundOrder),
        },
        reading: {
          findUnique: vi.fn().mockResolvedValue(failedReading),
          create: vi.fn(),
          update: vi.fn().mockResolvedValue({ ...failedReading, status: "PENDING" }),
        },
      };
      const db = {
        paymentOrder: { findFirst: vi.fn().mockResolvedValue(foundOrder) },
        $transaction: vi.fn(async (worker: (client: typeof tx) => unknown) => worker(tx)),
      };
      return { db, tx };
    }

    it("requeues the same failed reading when its exact paid order proves entitlement", async () => {
      const { db, tx } = retryDb();

      const result = await retryPaidFullReading(db as never, "user-1", "chart-1", failedReading);

      expect(db.paymentOrder.findFirst).toHaveBeenCalledWith({
        where: { id: "order-1", userId: "user-1", status: "PAID", paidAt: { not: null } },
      });
      expect(tx.reading.update).toHaveBeenCalledWith({
        where: { id: "reading-1" },
        data: expect.objectContaining({
          status: "PENDING",
          priceCoins: 0,
          content: null,
          error: null,
          promptMeta: expect.objectContaining({ paymentOrderId: "order-1" }),
        }),
      });
      expect(result).toMatchObject({ readingId: "reading-1" });
    });

    it("rejects missing or mismatched payment evidence", async () => {
      const mismatches = [
        { ...order, userId: "user-2" },
        { ...order, status: "PENDING" },
        { ...order, paidAt: null },
        { ...order, rawPayload: { directReading: { chartId: "chart-2", type: "FULL", scopeKey: "all" } } },
      ];

      for (const mismatch of mismatches) {
        const { db, tx } = retryDb(mismatch as typeof order);
        await expect(retryPaidFullReading(db as never, "user-1", "chart-1", failedReading)).resolves.toBeNull();
        expect(tx.reading.update).not.toHaveBeenCalled();
      }
    });

    it("does not query payment evidence unless the reading is FAILED with an order id", async () => {
      const { db } = retryDb();

      await expect(retryPaidFullReading(db as never, "user-1", "chart-1", { ...failedReading, status: "PENDING" })).resolves.toBeNull();
      await expect(retryPaidFullReading(db as never, "user-1", "chart-1", { ...failedReading, promptMeta: {} })).resolves.toBeNull();
      await expect(retryPaidFullReading(db as never, "user-2", "chart-1", failedReading)).resolves.toBeNull();

      expect(db.paymentOrder.findFirst).not.toHaveBeenCalled();
    });
  });
});
