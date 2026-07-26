import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  isPayOSRequestPaid,
  paidReadingOrderPayload,
  settlePaidOrder,
  verifyPayOSWebhook,
} from "@/lib/payos";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload?.data) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const signature = payload.signature || payload.data.signature;
  if (!verifyPayOSWebhook(payload.data, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let orderCode: bigint;
  try {
    orderCode = BigInt(payload.data.orderCode);
  } catch {
    return NextResponse.json({ error: "Invalid orderCode" }, { status: 400 });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ ok: true, mode: "demo" });

  const order = await db.paymentOrder.findUnique({ where: { orderCode } });
  if (!order) return NextResponse.json({ ok: true, ignored: "unknown-order" });

  const paidStatus =
    payload.data.code === "00" ||
    payload.data.desc === "success" ||
    payload.data.status === "PAID"
      ? "PAID"
      : payload.data.status;
  const isPaid = isPayOSRequestPaid({
    status: paidStatus,
    amountPaid: Number(payload.data.amountPaid ?? payload.data.amount ?? 0),
    raw: payload.data,
  }, order.amountVnd);
  if (!isPaid) {
    if (order.status !== "PAID") {
      const readingMetadata = paidReadingOrderPayload(order.rawPayload);
      let rawPayload = payload;
      if (readingMetadata) {
        const { kind, ...metadataValue } = readingMetadata;
        rawPayload = { raw: payload, [kind]: metadataValue };
      }
      await db.paymentOrder.update({
        where: { id: order.id },
        data: {
          status: "FAILED",
          rawPayload,
        },
      });
    }
    return NextResponse.json({ ok: true, paid: false });
  }

  const idempotent = order.status === "PAID";
  await settlePaidOrder(db, order, payload);
  return NextResponse.json({ ok: true, idempotent });
}
