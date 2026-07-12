import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { creditPaidTopupOrder, verifyPayOSWebhook } from "@/lib/payos";
import { generateReading } from "@/lib/ai";
import type { TuViChart } from "@/lib/chart";

function quickReadingPayload(rawPayload: unknown) {
  if (!rawPayload || typeof rawPayload !== "object" || !("quickReading" in rawPayload)) return null;
  const quickReading = (rawPayload as { quickReading?: unknown }).quickReading;
  if (!quickReading || typeof quickReading !== "object") return null;
  const payload = quickReading as { chartId?: unknown; type?: unknown; scopeKey?: unknown };
  if (typeof payload.chartId !== "string" || typeof payload.type !== "string" || typeof payload.scopeKey !== "string") return null;
  return {
    chartId: payload.chartId,
    type: payload.type as "FULL" | "PALACE" | "DAI_VAN" | "NGUYET_VAN" | "NHAT_VAN",
    scopeKey: payload.scopeKey,
  };
}

async function completeQuickReading(orderId: string) {
  const db = getDb();
  if (!db) return;
  const order = await db.paymentOrder.findUnique({ where: { id: orderId } });
  const quick = quickReadingPayload(order?.rawPayload);
  if (!order || !quick) return;

  const existing = await db.reading.findUnique({
    where: {
      userId_chartId_type_scopeKey: {
        userId: order.userId,
        chartId: quick.chartId,
        type: quick.type,
        scopeKey: quick.scopeKey,
      },
    },
  });
  if (existing?.status === "COMPLETED" && existing.content) return;

  const chart = await db.chart.findUnique({ where: { id: quick.chartId } });
  if (!chart) return;
  const result = await generateReading(chart.chart as TuViChart, quick.type, quick.scopeKey);
  await db.reading.upsert({
    where: {
      userId_chartId_type_scopeKey: {
        userId: order.userId,
        chartId: quick.chartId,
        type: quick.type,
        scopeKey: quick.scopeKey,
      },
    },
    update: {
      status: "COMPLETED",
      content: result.content,
      priceCoins: 0,
      model: result.model,
      promptMeta: { type: quick.type, scopeKey: quick.scopeKey, model: result.model, source: "quick-email-checkout" },
    },
    create: {
      userId: order.userId,
      chartId: quick.chartId,
      type: quick.type,
      scopeKey: quick.scopeKey,
      status: "COMPLETED",
      priceCoins: 0,
      content: result.content,
      model: result.model,
      promptMeta: { type: quick.type, scopeKey: quick.scopeKey, model: result.model, source: "quick-email-checkout" },
    },
  });
}

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
  if (order.status === "PAID") {
    const quick = quickReadingPayload(order.rawPayload);
    if (quick) await completeQuickReading(order.id);
    else await creditPaidTopupOrder(db, order, payload);
    return NextResponse.json({ ok: true, idempotent: true });
  }

  const isPaid = payload.data.code === "00" || payload.data.desc === "success" || payload.data.status === "PAID";
  if (!isPaid) {
    await db.paymentOrder.update({
      where: { id: order.id },
      data: { status: "FAILED", rawPayload: payload },
    });
    return NextResponse.json({ ok: true, paid: false });
  }

  const quick = quickReadingPayload(order.rawPayload);
  if (!quick) {
    await creditPaidTopupOrder(db, order, payload);
    return NextResponse.json({ ok: true });
  }
  await db.$transaction(async (tx) => {
    await tx.paymentOrder.update({
      where: { id: order.id },
      data: { status: "PAID", paidAt: new Date(), rawPayload: quick ? { raw: payload, quickReading: quick } : payload },
    });
    if (!quick) {
      const user = await tx.user.findUniqueOrThrow({ where: { id: order.userId }, select: { coinBalance: true } });
      const balance = user.coinBalance + order.coins;
      await tx.user.update({ where: { id: order.userId }, data: { coinBalance: balance } });
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
    }
  });
  if (quick) await completeQuickReading(order.id);

  return NextResponse.json({ ok: true });
}
