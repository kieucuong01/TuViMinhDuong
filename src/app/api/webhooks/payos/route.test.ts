import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeSource = readFileSync(fileURLToPath(new URL("./route.ts", import.meta.url)), "utf8");
const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  isPayOSRequestPaid: vi.fn(),
  paidReadingOrderPayload: vi.fn(),
  verifyPayOSWebhook: vi.fn(),
  settlePaidOrder: vi.fn(),
  isPayOSEnabled: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  },
}));
vi.mock("@/lib/db", () => ({ getDb: mocks.getDb }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ isPayOSEnabled: mocks.isPayOSEnabled }));
vi.mock("@/lib/payos", () => ({
  isPayOSRequestPaid: mocks.isPayOSRequestPaid,
  paidReadingOrderPayload: mocks.paidReadingOrderPayload,
  verifyPayOSWebhook: mocks.verifyPayOSWebhook,
  settlePaidOrder: mocks.settlePaidOrder,
  getPayOSPaymentRequest: vi.fn(),
}));

const order = {
  id: "order-1",
  userId: "user-1",
  orderCode: BigInt(123),
  amountVnd: 199000,
  coins: 0,
  status: "PENDING",
  paidAt: null,
  rawPayload: { directReading: { chartId: "chart-1", type: "FULL", scopeKey: "all" } },
};

function request(data: Record<string, unknown>, signature = "valid") {
  return new Request("http://test.local/api/webhooks/payos", {
    method: "POST",
    body: JSON.stringify({ data, signature }),
  });
}

describe("PayOS webhook", () => {
  const db = {
    quanOrder: { updateMany: vi.fn() },
    paymentOrder: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDb.mockReturnValue(db);
    mocks.isPayOSEnabled.mockReturnValue(true);
    mocks.paidReadingOrderPayload.mockReturnValue({
      kind: "directReading",
      chartId: "chart-1",
      type: "FULL",
      scopeKey: "all",
    });
    mocks.verifyPayOSWebhook.mockReturnValue(true);
    mocks.isPayOSRequestPaid.mockReturnValue(true);
    db.paymentOrder.findUnique.mockResolvedValue(order);
    mocks.settlePaidOrder.mockResolvedValue({
      status: "PAID",
      readingId: "reading-1",
      chartId: "chart-1",
      purchaseType: "direct_full",
    });
  });

  it("rejects an invalid signature", async () => {
    mocks.verifyPayOSWebhook.mockReturnValue(false);
    const { POST } = await import("./route");

    expect((await POST(request({ orderCode: "123", status: "PAID" }))).status).toBe(401);
    expect(mocks.settlePaidOrder).not.toHaveBeenCalled();
  });

  it("delegates a paid direct order to the idempotent settlement helper", async () => {
    const { POST } = await import("./route");
    const response = await POST(request({ orderCode: "123", status: "PAID" }));

    expect(await response.json()).toEqual({ ok: true, idempotent: false });
    expect(mocks.settlePaidOrder).toHaveBeenCalledWith(db, order, expect.any(Object));
    expect(db.paymentOrder.update).not.toHaveBeenCalled();
    expect(routeSource).not.toContain("generateReading");
  });

  it("settles a duplicate paid callback idempotently", async () => {
    db.paymentOrder.findUnique.mockResolvedValue({ ...order, status: "PAID", paidAt: new Date() });
    const { POST } = await import("./route");
    const response = await POST(request({ orderCode: "123", code: "00" }));

    expect(await response.json()).toEqual({ ok: true, idempotent: true });
    expect(mocks.settlePaidOrder).toHaveBeenCalledTimes(1);
  });

  it("does not settle a signed underpayment", async () => {
    mocks.isPayOSRequestPaid.mockReturnValue(false);
    const { POST } = await import("./route");
    const response = await POST(request({
      orderCode: "123",
      status: "PAID",
      amountPaid: 198000,
    }));

    expect(mocks.isPayOSRequestPaid).toHaveBeenCalledWith(
      expect.objectContaining({ amountPaid: 198000 }),
      order.amountVnd,
    );
    expect(mocks.settlePaidOrder).not.toHaveBeenCalled();
    expect(db.paymentOrder.update).toHaveBeenCalledWith({
      where: { id: order.id },
      data: expect.objectContaining({ status: "FAILED" }),
    });
    expect(await response.json()).toEqual({ ok: true, paid: false });
  });

  it("marks an unpaid pending callback failed but never downgrades a paid order", async () => {
    mocks.isPayOSRequestPaid.mockReturnValue(false);
    const { POST } = await import("./route");
    await POST(request({ orderCode: "123", status: "CANCELLED" }));
    expect(db.paymentOrder.update).toHaveBeenCalledWith({
      where: { id: "order-1" },
      data: {
        status: "FAILED",
        rawPayload: {
          raw: expect.any(Object),
          directReading: { chartId: "chart-1", type: "FULL", scopeKey: "all" },
        },
      },
    });

    vi.clearAllMocks();
    mocks.getDb.mockReturnValue(db);
    mocks.verifyPayOSWebhook.mockReturnValue(true);
    mocks.isPayOSRequestPaid.mockReturnValue(false);
    db.paymentOrder.findUnique.mockResolvedValue({ ...order, status: "PAID", paidAt: new Date() });
    await POST(request({ orderCode: "123", status: "CANCELLED" }));
    expect(db.paymentOrder.update).not.toHaveBeenCalled();
  });

  it("settles the exact signed Tử Vi Quán order once without touching account orders", async () => {
    db.quanOrder.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    const { POST } = await import("./route");
    const data = {
      orderCode: 1_000_000_000_001, code: "00", currency: "VND",
      amount: 200_000, paymentLinkId: "quan-link",
    };
    expect(await (await POST(request(data))).json()).toEqual({ ok: true, settled: true });
    expect(await (await POST(request(data))).json()).toEqual({ ok: true, settled: false });
    expect(db.quanOrder.updateMany).toHaveBeenCalledWith({
      where: {
        orderCode: 1_000_000_000_001n, status: { in: ["PENDING", "CANCELLED"] },
        amountVnd: 200_000, paymentLinkId: "quan-link",
      },
      data: { status: "PAID", paidAt: expect.any(Date) },
    });
    expect(db.paymentOrder.findUnique).not.toHaveBeenCalled();
    expect(mocks.settlePaidOrder).not.toHaveBeenCalled();
  });

  it("rejects Tử Vi Quán settlement without production PayOS credentials", async () => {
    mocks.isPayOSEnabled.mockReturnValue(false);
    const { POST } = await import("./route");
    const data = {
      orderCode: 1_000_000_000_001, code: "00", currency: "VND",
      amount: 200_000, paymentLinkId: "quan-link",
    };
    expect(await (await POST(request(data))).json()).toEqual({ ok: true, settled: false });
    expect(db.quanOrder.updateMany).not.toHaveBeenCalled();
  });
});
