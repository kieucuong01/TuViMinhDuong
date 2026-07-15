import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getDb: vi.fn(),
  getPayOSPaymentRequest: vi.fn(),
  isPayOSRequestPaid: vi.fn(),
  paidReadingOrderPayload: vi.fn(),
  settlePaidOrder: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  },
}));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/db", () => ({ getDb: mocks.getDb }));
vi.mock("@/lib/payos", () => ({
  getPayOSPaymentRequest: mocks.getPayOSPaymentRequest,
  isPayOSRequestPaid: mocks.isPayOSRequestPaid,
  paidReadingOrderPayload: mocks.paidReadingOrderPayload,
  settlePaidOrder: mocks.settlePaidOrder,
}));

const directOrder = {
  id: "order-1",
  userId: "user-1",
  orderCode: BigInt(123),
  status: "PENDING",
  amountVnd: 199000,
  coins: 0,
  paidAt: null,
  rawPayload: { directReading: { chartId: "chart-1", type: "FULL", scopeKey: "all" } },
  package: null,
};

describe("payment status conversion endpoint", () => {
  const db = { paymentOrder: { findUnique: vi.fn() } };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.getDb.mockReturnValue(db);
    db.paymentOrder.findUnique.mockResolvedValue(directOrder);
    mocks.getPayOSPaymentRequest.mockResolvedValue({ status: "PAID", amountPaid: 199000, raw: { ok: true } });
    mocks.isPayOSRequestPaid.mockReturnValue(true);
    mocks.paidReadingOrderPayload.mockReturnValue({
      kind: "directReading",
      chartId: "chart-1",
      type: "FULL",
      scopeKey: "all",
    });
    mocks.settlePaidOrder.mockResolvedValue({
      status: "PAID",
      amountVnd: 199000,
      coins: 0,
      readingId: "reading-1",
      chartId: "chart-1",
      purchaseType: "direct_full",
    });
  });

  it("verifies PayOS, settles the direct order, and returns purchase attribution", async () => {
    const { GET } = await import("./route");
    const response = await GET(new Request("http://test.local/api/payments/status?orderCode=123"));
    const body = await response.json();

    expect(body).toMatchObject({
      verified: true,
      transactionId: "123",
      value: 199000,
      chartId: "chart-1",
      purchaseType: "direct_full",
      readingId: "reading-1",
      coins: 0,
    });
    expect(mocks.getPayOSPaymentRequest).toHaveBeenCalledWith("123");
    expect(mocks.settlePaidOrder).toHaveBeenCalledTimes(1);
  });

  it("calls PayOS again even when the webhook already marked the order paid", async () => {
    db.paymentOrder.findUnique.mockResolvedValue({ ...directOrder, status: "PAID", paidAt: new Date() });
    const { GET } = await import("./route");

    await GET(new Request("http://test.local/api/payments/status?orderCode=123"));

    expect(mocks.getPayOSPaymentRequest).toHaveBeenCalledWith("123");
    expect(mocks.settlePaidOrder).toHaveBeenCalledTimes(1);
  });

  it("does not verify or settle an unpaid pending order", async () => {
    mocks.isPayOSRequestPaid.mockReturnValue(false);
    mocks.settlePaidOrder.mockResolvedValue(null);
    const { GET } = await import("./route");
    const body = await (await GET(new Request("http://test.local/api/payments/status?orderCode=123"))).json();

    expect(body).toEqual({ verified: false, status: "PENDING", transactionId: "123" });
    expect(mocks.settlePaidOrder).not.toHaveBeenCalled();
  });

  it("hides orders owned by another user", async () => {
    db.paymentOrder.findUnique.mockResolvedValue({ ...directOrder, userId: "user-2" });
    const { GET } = await import("./route");

    expect((await GET(new Request("http://test.local/api/payments/status?orderCode=123"))).status).toBe(404);
  });
});
