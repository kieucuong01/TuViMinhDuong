import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { settlePaidOrder, verifyPayOSWebhook } from "@/lib/payos";

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

  const isPaid = payload.data.code === "00" || payload.data.desc === "success" || payload.data.status === "PAID";
  if (!isPaid) {
    if (order.status !== "PAID") {
      await db.paymentOrder.update({
        where: { id: order.id },
        data: { status: "FAILED", rawPayload: payload },
      });
    }
    return NextResponse.json({ ok: true, paid: false });
  }

  const idempotent = order.status === "PAID";
  await settlePaidOrder(db, order, payload);
  return NextResponse.json({ ok: true, idempotent });
}
