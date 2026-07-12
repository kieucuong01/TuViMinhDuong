import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  verifyPayOSWebhook: vi.fn(),
  creditPaidTopupOrder: vi.fn(),
  generateReading: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ getDb: mocks.getDb }));
vi.mock("@/lib/payos", () => ({
  creditPaidTopupOrder: mocks.creditPaidTopupOrder,
  verifyPayOSWebhook: mocks.verifyPayOSWebhook,
}));
vi.mock("@/lib/ai", () => ({ generateReading: mocks.generateReading }));

type FakePaymentOrder = {
  id: string;
  orderCode: bigint;
  userId: string;
  coins: number;
  status: "PENDING" | "PAID" | "FAILED";
  rawPayload: unknown;
};

function createDb(orderOverrides: Partial<FakePaymentOrder> = {}) {
  const order: FakePaymentOrder = {
    id: "order-1",
    orderCode: BigInt(123456),
    userId: "user-1",
    coins: 199,
    status: "PENDING",
    rawPayload: {},
    ...orderOverrides,
  };

  const db = {
    paymentOrder: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string; orderCode?: bigint } }) => {
        if (where.id === order.id || where.orderCode === order.orderCode) return order;
        return null;
      }),
      update: vi.fn(async ({ data }: { data: Partial<FakePaymentOrder> }) => {
        Object.assign(order, data);
        return order;
      }),
    },
    user: {
      findUniqueOrThrow: vi.fn(async () => ({ coinBalance: 10 })),
      update: vi.fn(async () => null),
    },
    coinLedger: {
      create: vi.fn(async () => null),
    },
    reading: {
      findUnique: vi.fn(async () => null),
      upsert: vi.fn(async () => null),
    },
    chart: {
      findUnique: vi.fn(async () => ({ id: "chart-1", chart: { input: { fullName: "Test User" }, palaces: [] } })),
    },
    $transaction: vi.fn(async (callback: (tx: typeof db) => Promise<unknown>) => callback(db)),
  };

  return { db, order };
}

async function postWebhook(payload: unknown) {
  const { POST } = await import("./route");
  return POST(
    new Request("http://test.local/api/webhooks/payos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

describe("PayOS webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyPayOSWebhook.mockReturnValue(true);
    mocks.creditPaidTopupOrder.mockImplementation(async (_db, order: FakePaymentOrder) => {
      order.status = "PAID";
      return order;
    });
    mocks.generateReading.mockResolvedValue({
      content: "paid quick reading",
      model: "test-model",
      prompt: "test prompt",
    });
  });

  it("rejects invalid signatures before touching payment orders", async () => {
    const { db } = createDb();
    mocks.getDb.mockReturnValue(db);
    mocks.verifyPayOSWebhook.mockReturnValue(false);

    const response = await postWebhook({
      data: { orderCode: 123456, status: "PAID" },
      signature: "bad-signature",
    });

    expect(response.status).toBe(401);
    expect(db.paymentOrder.findUnique).not.toHaveBeenCalled();
    expect(db.coinLedger.create).not.toHaveBeenCalled();
  });

  it("delegates paid topup crediting to the idempotent PayOS helper", async () => {
    const { db } = createDb();
    mocks.getDb.mockReturnValue(db);

    const response = await postWebhook({
      data: { orderCode: 123456, status: "PAID" },
      signature: "valid-signature",
    });

    expect(response.status).toBe(200);
    expect(mocks.creditPaidTopupOrder).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ id: "order-1" }),
      expect.objectContaining({ data: { orderCode: 123456, status: "PAID" } }),
    );
    expect(db.coinLedger.create).not.toHaveBeenCalled();

    const duplicateResponse = await postWebhook({
      data: { orderCode: 123456, status: "PAID" },
      signature: "valid-signature",
    });

    expect(duplicateResponse.status).toBe(200);
    expect(mocks.creditPaidTopupOrder).toHaveBeenCalledTimes(2);
  });

  it.each([
    { status: "CANCELLED", code: "01" },
    { status: "FAILED", code: "02" },
    { status: "EXPIRED", code: "03" },
  ])("marks $status webhook payloads as failed without crediting coins", async (data) => {
    const { db } = createDb();
    mocks.getDb.mockReturnValue(db);

    const response = await postWebhook({
      data: { orderCode: 123456, ...data },
      signature: "valid-signature",
    });

    expect(response.status).toBe(200);
    expect(db.paymentOrder.update).toHaveBeenCalledWith({
      where: { id: "order-1" },
      data: expect.objectContaining({ status: "FAILED" }),
    });
    expect(db.user.update).not.toHaveBeenCalled();
    expect(db.coinLedger.create).not.toHaveBeenCalled();
  });

  it("does not downgrade or double-credit a paid order when a later failed webhook arrives", async () => {
    const { db } = createDb({ status: "PAID" });
    mocks.getDb.mockReturnValue(db);

    const response = await postWebhook({
      data: { orderCode: 123456, status: "FAILED", code: "02" },
      signature: "valid-signature",
    });

    expect(response.status).toBe(200);
    expect(db.paymentOrder.update).not.toHaveBeenCalled();
    expect(db.user.update).not.toHaveBeenCalled();
    expect(db.coinLedger.create).not.toHaveBeenCalled();
  });

  it("completes quick email readings after payment without crediting coins", async () => {
    const { db } = createDb({
      rawPayload: {
        quickReading: {
          chartId: "chart-1",
          type: "FULL",
          scopeKey: "all",
        },
      },
    });
    mocks.getDb.mockReturnValue(db);

    const response = await postWebhook({
      data: { orderCode: 123456, code: "00", desc: "success" },
      signature: "valid-signature",
    });

    expect(response.status).toBe(200);
    expect(db.user.update).not.toHaveBeenCalled();
    expect(db.coinLedger.create).not.toHaveBeenCalled();
    expect(mocks.generateReading).toHaveBeenCalledTimes(1);
    expect(db.reading.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_chartId_type_scopeKey: {
            userId: "user-1",
            chartId: "chart-1",
            type: "FULL",
            scopeKey: "all",
          },
        },
      }),
    );
  });
});
