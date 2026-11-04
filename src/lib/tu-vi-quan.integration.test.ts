import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it, vi } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { settleQuanWebhook } from "./tu-vi-quan-payment";
import { checkoutQuanSession, changeQuanAdmission, restoreQuanSession, answerQuanTurn, quanTransaction, readQuanSession, reissueQuanRecoveryCode } from "./tu-vi-quan-session";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ isPayOSEnabled: () => true }));
vi.mock("@/lib/data/settings", () => ({ getOperationSettings: async () => ({ paymentsEnabled: true, paidReadingsEnabled: true }) }));
vi.mock("@/lib/llm-router", () => ({
  hasExternalLlmProvider: () => true,
  generateWithLlmRouter: vi.fn(async () => ({ text: "Mình cùng xem các cung liên quan đến công việc nhé." })),
}));
vi.mock("@/lib/payos", () => ({
  getPayOSPaymentRequest: vi.fn(),
  createPayOSCustomCheckout: vi.fn(async (input: { orderCode: number; amountVnd: number }) => ({
    checkoutUrl: "https://pay.payos.vn/test",
    paymentLinkId: String(input.orderCode),
    raw: { code: "00", data: { orderCode: input.orderCode, amount: input.amountVnd, qrCode: "test-qr" } },
  })),
}));

const url = process.env.QUAN_TEST_DATABASE_URL;
if (url && !/^postgresql:\/\/[^/]+@127\.0\.0\.1:\d+\/quan_test(?:_\d+)?$/.test(url)) {
  throw new Error("Use a disposable localhost quan_test database");
}
const db = url ? new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }) : null;
const owners = [randomUUID(), randomUUID(), randomUUID()];
const guest = (i: number) => ({ id: owners[i], alias: "Khách thử" });
const chart = { fullName: "Khách thử", gender: "male", calendarType: "solar", day: 1, month: 1, year: 1991, birthHour: 12 };

afterAll(async () => {
  if (db) {
    await db.quanOrder.deleteMany({ where: { ownerId: { in: owners } } });
    await db.quanSettings.deleteMany({ where: { id: "global" } });
    await db.$disconnect();
  }
  vi.unstubAllEnvs();
});

describe.skipIf(!db)("Tử Vi Quán with PostgreSQL and simulated PayOS", () => {
  it("settles both packages once, preserves FIFO and isolates the restored session", async () => {
    const client = db!;
    vi.stubEnv("TU_VI_QUAN_PAYMENTS_ENABLED", "true");
    await client.quanSettings.upsert({ where: { id: "global" }, create: { id: "global", maxTables: 1 }, update: { maxTables: 1 } });

    const fifteen = await checkoutQuanSession(client, guest(0), 15, chart);
    const thirty = await checkoutQuanSession(client, guest(1), 30, chart);
    expect([fifteen.amountVnd, thirty.amountVnd]).toEqual([100_000, 200_000]);
    for (const [id, amount] of [[fifteen.id, 100_000], [thirty.id, 200_000]] as const) {
      const row = await client.quanOrder.findUniqueOrThrow({ where: { id } });
      const payload = { code: "00", currency: "VND", paymentLinkId: row.paymentLinkId, amount };
      expect(await settleQuanWebhook(client, row.orderCode, { ...payload, amount: amount - 1 })).toBe(false);
      const settled = await Promise.all([settleQuanWebhook(client, row.orderCode, payload), settleQuanWebhook(client, row.orderCode, payload)]);
      expect(settled.filter(Boolean)).toHaveLength(1);
    }

    expect(await changeQuanAdmission(client, owners[0], fifteen.id, "join")).toMatchObject({ status: "invited", tableNumber: 1 });
    const waiting = await changeQuanAdmission(client, owners[1], thirty.id, "join");
    expect(waiting.status).toBe("queued");
    expect(waiting.position).toBe(1);

    const [first, duplicate] = await Promise.all([
      changeQuanAdmission(client, owners[0], fifteen.id, "start"),
      changeQuanAdmission(client, owners[0], fifteen.id, "start"),
    ]);
    expect(first.remainingSeconds).toBe(900);
    expect(first.endsAt).toBe(duplicate.endsAt);
    await expect(quanTransaction(client, (tx, now) => readQuanSession(tx, owners[2], fifteen.id, now))).rejects.toMatchObject({ status: 404 });
    const replacement = await reissueQuanRecoveryCode(client, owners[0], fifteen.id);
    await expect(restoreQuanSession(client, guest(2), fifteen.recoveryCode)).rejects.toMatchObject({ status: 404 });
    const restored = await restoreQuanSession(client, guest(2), replacement.recoveryCode);
    expect(restored.endsAt).toBe(first.endsAt);
    await expect(answerQuanTurn(client, owners[0], fifteen.id, "turn-old-owner", "Công việc ra sao?")).rejects.toMatchObject({ status: 404 });
    const answer = await answerQuanTurn(client, owners[2], fifteen.id, "turn-verified", "Công việc ra sao?");
    expect(answer.messages[0].answer).toContain("công việc");

    await client.quanOrder.update({ where: { id: fifteen.id }, data: { endsAt: new Date(Date.now() - 1000) } });
    expect((await quanTransaction(client, (tx, now) => readQuanSession(tx, owners[2], fifteen.id, now))).status).toBe("ended");
    expect(await changeQuanAdmission(client, owners[1], thirty.id, "start")).toMatchObject({
      status: "active", remainingSeconds: 1800, tableNumber: 1,
    });
    const outageSince = new Date(Date.now() - 121_000);
    await client.quanOrder.update({
      where: { id: thirty.id },
      data: { outageSince, endsAt: new Date(outageSince.getTime() + 900_000) },
    });
    const afterOutage = () => quanTransaction(client, (tx, now) => readQuanSession(tx, owners[1], thirty.id, now));
    expect(await afterOutage()).toMatchObject({ status: "refund", refundAmountVnd: 100_000 });
    expect(await afterOutage()).toMatchObject({ status: "refund", refundAmountVnd: 100_000 });
  });
});
