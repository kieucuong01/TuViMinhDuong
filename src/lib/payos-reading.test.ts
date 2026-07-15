import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ APP_URL: "https://example.test", isPayOSEnabled: () => true }));

import { completePaidReadingOrder, paidReadingOrderPayload } from "@/lib/payos";

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
  });
});
