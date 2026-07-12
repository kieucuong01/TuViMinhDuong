import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getDb: vi.fn(),
  getPayOSPaymentRequest: vi.fn(),
  isPayOSRequestPaid: vi.fn(),
  creditPaidTopupOrder: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/db", () => ({ getDb: mocks.getDb }));
vi.mock("@/lib/payos", () => ({
  getPayOSPaymentRequest: mocks.getPayOSPaymentRequest,
  isPayOSRequestPaid: mocks.isPayOSRequestPaid,
  creditPaidTopupOrder: mocks.creditPaidTopupOrder,
}));

function createDb(order: Record<string, unknown> | null) {
  return {
    paymentOrder: {
      findUnique: vi.fn(async () => order),
    },
  };
}

async function getStatus(orderCode = "123456") {
  const { GET } = await import("./route");
  return GET(new Request(`http://test.local/api/payments/status?orderCode=${orderCode}`));
}

describe("payment status conversion endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getPayOSPaymentRequest.mockResolvedValue(null);
    mocks.isPayOSRequestPaid.mockReturnValue(false);
    mocks.creditPaidTopupOrder.mockResolvedValue(null);
    mocks.getCurrentUser.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      name: "User",
      role: "USER",
      coinBalance: 0,
    });
  });

  it("only marks a user's paid order as verified after webhook status is PAID", async () => {
    const db = createDb({
      id: "order-1",
      userId: "user-1",
      orderCode: BigInt(123456),
      status: "PAID",
      amountVnd: 199000,
      coins: 209,
      paidAt: new Date("2026-06-01T12:00:00+07:00"),
      rawPayload: {},
      package: { key: "full-reading" },
    });
    mocks.getDb.mockReturnValue(db);

    const response = await getStatus();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      verified: true,
      status: "PAID",
      transactionId: "123456",
      value: 199000,
      currency: "VND",
      packageKey: "full-reading",
      coins: 209,
    });
  });

  it("does not expose conversion value for pending or unrelated orders", async () => {
    const pendingDb = createDb({
      id: "order-1",
      userId: "user-1",
      orderCode: BigInt(123456),
      status: "PENDING",
      amountVnd: 199000,
      coins: 209,
      paidAt: null,
      rawPayload: {},
      package: { key: "full-reading" },
    });
    mocks.getDb.mockReturnValue(pendingDb);

    const pendingResponse = await getStatus();
    expect(await pendingResponse.json()).toEqual({ verified: false, status: "PENDING", transactionId: "123456" });

    const otherUserDb = createDb({
      id: "order-1",
      userId: "user-2",
      orderCode: BigInt(123456),
      status: "PAID",
      amountVnd: 199000,
      coins: 209,
      paidAt: new Date(),
      rawPayload: {},
      package: { key: "full-reading" },
    });
    mocks.getDb.mockReturnValue(otherUserDb);

    const forbiddenResponse = await getStatus();
    expect(forbiddenResponse.status).toBe(404);
  });

  it("reconciles a pending topup when PayOS confirms the order is paid", async () => {
    const db = createDb({
      id: "order-1",
      userId: "user-1",
      orderCode: BigInt(123456),
      status: "PENDING",
      amountVnd: 199000,
      coins: 209,
      paidAt: null,
      rawPayload: { checkout: true },
      package: { key: "full-reading" },
    });
    mocks.getDb.mockReturnValue(db);
    const payosStatus = { status: "PAID", amountPaid: 199000, raw: { data: { status: "PAID" } } };
    mocks.getPayOSPaymentRequest.mockResolvedValue(payosStatus);
    mocks.isPayOSRequestPaid.mockReturnValue(true);
    mocks.creditPaidTopupOrder.mockResolvedValue({
      userId: "user-1",
      status: "PAID",
      amountVnd: 199000,
      coins: 209,
      paidAt: new Date("2026-07-11T18:47:09+07:00"),
      package: { key: "full-reading" },
    });

    const response = await getStatus();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.getPayOSPaymentRequest).toHaveBeenCalledWith("123456");
    expect(mocks.creditPaidTopupOrder).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ id: "order-1", status: "PENDING", amountVnd: 199000 }),
      { raw: { checkout: true }, reconciliation: payosStatus.raw },
    );
    expect(json).toMatchObject({
      verified: true,
      status: "PAID",
      transactionId: "123456",
      value: 199000,
      currency: "VND",
      packageKey: "full-reading",
      coins: 209,
    });
  });
});
