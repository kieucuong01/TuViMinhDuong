import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyPayOSWebhook } from "@/lib/payos";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload?.data) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const signature = payload.signature || payload.data.signature;
  if (!verifyPayOSWebhook(payload.data, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const orderCode = BigInt(payload.data.orderCode);
  const db = getDb();
  if (!db) return NextResponse.json({ ok: true, mode: "demo" });

  const order = await db.paymentOrder.findUnique({ where: { orderCode } });
  if (!order) return NextResponse.json({ ok: true, ignored: "unknown-order" });
  if (order.status === "PAID") return NextResponse.json({ ok: true, idempotent: true });

  const isPaid = payload.data.code === "00" || payload.data.desc === "success" || payload.data.status === "PAID";
  if (!isPaid) {
    await db.paymentOrder.update({
      where: { id: order.id },
      data: { status: "FAILED", rawPayload: payload },
    });
    return NextResponse.json({ ok: true, paid: false });
  }

  await db.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: order.userId }, select: { coinBalance: true } });
    const balance = user.coinBalance + order.coins;
    await tx.user.update({ where: { id: order.userId }, data: { coinBalance: balance } });
    await tx.paymentOrder.update({
      where: { id: order.id },
      data: { status: "PAID", paidAt: new Date(), rawPayload: payload },
    });
    await tx.coinLedger.create({
      data: {
        userId: order.userId,
        type: "CREDIT",
        amount: order.coins,
        balance,
        reason: "Nạp xu PayOS",
        referenceId: order.id,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
