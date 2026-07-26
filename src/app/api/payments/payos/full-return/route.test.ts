import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  consumeMagicSessionToken: vi.fn(),
  getDb: vi.fn(),
  getPayOSPaymentRequest: vi.fn(),
  isPayOSRequestPaid: vi.fn(),
  paidReadingOrderPayload: vi.fn(),
  settlePaidOrder: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    redirect: (url: URL) => Response.redirect(url, 307),
  },
}));
vi.mock("@/lib/auth", () => ({
  getCurrentUser: mocks.getCurrentUser,
  consumeMagicSessionToken: mocks.consumeMagicSessionToken,
}));
vi.mock("@/lib/db", () => ({ getDb: mocks.getDb }));
vi.mock("@/lib/env", () => ({ APP_URL: "https://lasotinhhoa.vn" }));
vi.mock("@/lib/payos", () => ({
  getPayOSPaymentRequest: mocks.getPayOSPaymentRequest,
  isPayOSRequestPaid: mocks.isPayOSRequestPaid,
  paidReadingOrderPayload: mocks.paidReadingOrderPayload,
  settlePaidOrder: mocks.settlePaidOrder,
}));

const order = {
  id: "order-1",
  userId: "user-1",
  orderCode: BigInt(123),
  status: "PENDING",
  amountVnd: 199000,
  coins: 0,
  paidAt: null,
  rawPayload: { directReading: { chartId: "chart-1", type: "FULL", scopeKey: "all" } },
};

describe("direct FULL PayOS return", () => {
  const db = { paymentOrder: { findUnique: vi.fn() } };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.getDb.mockReturnValue(db);
    db.paymentOrder.findUnique.mockResolvedValue(order);
    mocks.paidReadingOrderPayload.mockReturnValue({
      kind: "directReading",
      chartId: "chart-1",
      type: "FULL",
      scopeKey: "all",
    });
    mocks.getPayOSPaymentRequest.mockResolvedValue({ status: "PAID", amountPaid: 199000, raw: {} });
    mocks.isPayOSRequestPaid.mockReturnValue(true);
    mocks.settlePaidOrder.mockResolvedValue({ status: "PAID", readingId: "reading-1", chartId: "chart-1" });
  });

  it("verifies PayOS and redirects to the one pending reading", async () => {
    const { GET } = await import("./route");
    const response = await GET(new Request("http://test.local/api/payments/payos/full-return?status=success&orderCode=123"));
    const location = response.headers.get("location") || "";

    expect(mocks.getPayOSPaymentRequest).toHaveBeenCalledWith("123");
    expect(mocks.settlePaidOrder).toHaveBeenCalledTimes(1);
    expect(location.startsWith("https://lasotinhhoa.vn/la-so/chart-1/nang-cao")).toBe(true);
    expect(location).toContain("reading=reading-1");
    expect(location).toContain("status=success");
  });

  it("restores the guest session from the order-bound checkout token before settling", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    mocks.consumeMagicSessionToken.mockResolvedValue({ id: "user-1" });
    mocks.paidReadingOrderPayload.mockReturnValue({
      kind: "directReading",
      chartId: "chart-1",
      type: "FULL",
      scopeKey: "all",
      token: "checkout_magic-1",
    });

    const { GET } = await import("./route");
    const response = await GET(new Request(
      "http://test.local/api/payments/payos/full-return?token=checkout_magic-1&status=success&orderCode=123",
    ));

    expect(mocks.consumeMagicSessionToken).toHaveBeenCalledWith("checkout_magic-1", "123");
    expect(mocks.consumeMagicSessionToken.mock.invocationCallOrder[0])
      .toBeLessThan(mocks.getPayOSPaymentRequest.mock.invocationCallOrder[0]);
    expect(mocks.getCurrentUser).not.toHaveBeenCalled();
    expect(mocks.settlePaidOrder).toHaveBeenCalledTimes(1);
    expect(response.headers.get("location")).toContain("/la-so/chart-1/nang-cao");
  });

  it("rejects a checkout token bound to another order before querying payment data", async () => {
    mocks.consumeMagicSessionToken.mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET(new Request(
      "http://test.local/api/payments/payos/full-return?token=checkout_magic-1&orderCode=999",
    ));

    expect(mocks.consumeMagicSessionToken).toHaveBeenCalledWith("checkout_magic-1", "999");
    expect(response.headers.get("location")).toContain("/la-so?checkout=invalid");
    expect(mocks.getDb).not.toHaveBeenCalled();
    expect(mocks.getPayOSPaymentRequest).not.toHaveBeenCalled();
    expect(mocks.settlePaidOrder).not.toHaveBeenCalled();
  });

  it("rejects an invalid order code without consuming the return token", async () => {
    const { GET } = await import("./route");
    const response = await GET(new Request(
      "http://test.local/api/payments/payos/full-return?token=magic-1&orderCode=invalid",
    ));

    expect(response.headers.get("location")).toContain("/la-so?checkout=invalid");
    expect(mocks.consumeMagicSessionToken).not.toHaveBeenCalled();
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it("rejects an empty token without falling back to the signed-in session", async () => {
    const { GET } = await import("./route");
    const response = await GET(new Request(
      "http://test.local/api/payments/payos/full-return?token=%20&orderCode=123",
    ));

    expect(response.headers.get("location")).toContain("/la-so?checkout=invalid");
    expect(mocks.consumeMagicSessionToken).not.toHaveBeenCalled();
    expect(mocks.getCurrentUser).not.toHaveBeenCalled();
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it("rejects an invalid token without querying the database or PayOS", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.consumeMagicSessionToken.mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET(new Request(
      "http://test.local/api/payments/payos/full-return?token=bad&orderCode=123",
    ));

    expect(response.headers.get("location")).toContain("/la-so?checkout=invalid");
    expect(mocks.getCurrentUser).not.toHaveBeenCalled();
    expect(mocks.getDb).not.toHaveBeenCalled();
    expect(mocks.getPayOSPaymentRequest).not.toHaveBeenCalled();
  });

  it("does not trust the success query when PayOS has not confirmed payment", async () => {
    mocks.isPayOSRequestPaid.mockReturnValue(false);
    const { GET } = await import("./route");
    const response = await GET(new Request("http://test.local/api/payments/payos/full-return?status=success&orderCode=123"));

    expect(response.headers.get("location")).toContain("/la-so/chart-1?checkout=pending");
    expect(mocks.settlePaidOrder).not.toHaveBeenCalled();
  });

  it("redirects safely when the current user does not own the order", async () => {
    db.paymentOrder.findUnique.mockResolvedValue({ ...order, userId: "user-2" });
    const { GET } = await import("./route");
    const response = await GET(new Request("http://test.local/api/payments/payos/full-return?orderCode=123"));

    expect(response.headers.get("location")).toContain("/la-so?checkout=forbidden");
    expect(mocks.getPayOSPaymentRequest).not.toHaveBeenCalled();
  });
});
