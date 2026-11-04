import "server-only";
import type { PrismaClient, QuanOrder } from "@/generated/prisma/client";
import { isPayOSEnabled } from "@/lib/env";
import { getPayOSPaymentRequest } from "@/lib/payos";
import { isExactQuanPayment } from "@/lib/tu-vi-quan-rules";

export const QUAN_ORDER_CODE_MIN = 1_000_000_000_000;
export const QUAN_ORDER_CODE_MAX = 100_000_000_000_000;

export function isQuanOrderCode(code: bigint) {
  return code >= BigInt(QUAN_ORDER_CODE_MIN) && code < BigInt(QUAN_ORDER_CODE_MAX);
}

export async function refreshQuanPayment(db: PrismaClient, order: QuanOrder, now = new Date()) {
  if (order.status !== "PENDING" || !isPayOSEnabled()) return;
  const checked = await db.quanOrder.updateMany({
    where: {
      id: order.id,
      status: "PENDING",
      OR: [{ checkedAt: null }, { checkedAt: { lte: new Date(now.getTime() - 8000) } }],
    },
    data: { checkedAt: now },
  });
  if (!checked.count) return;
  const payment = await getPayOSPaymentRequest(order.orderCode, AbortSignal.timeout(5000)).catch(() => null);
  if (isExactQuanPayment(payment, order.amountVnd)) {
    await db.quanOrder.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: { status: "PAID", paidAt: new Date() },
    });
  } else if (payment?.status === "CANCELLED" || payment?.status === "EXPIRED") {
    await db.quanOrder.updateMany({ where: { id: order.id, status: "PENDING" }, data: { status: "CANCELLED" } });
  }
}

export async function settleQuanWebhook(db: PrismaClient, orderCode: bigint, data: Record<string, unknown>) {
  if (!isPayOSEnabled() || data.code !== "00" || data.currency !== "VND" ||
      !Number.isSafeInteger(data.amount) || typeof data.paymentLinkId !== "string") return false;

  const result = await db.quanOrder.updateMany({
    where: { orderCode, status: { in: ["PENDING", "CANCELLED"] }, paymentLinkId: data.paymentLinkId, amountVnd: data.amount as number },
    data: { status: "PAID", paidAt: new Date() },
  });
  return result.count === 1;
}
