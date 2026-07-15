import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  getPayOSPaymentRequest,
  isPayOSRequestPaid,
  paidReadingOrderPayload,
  settlePaidOrder,
} from "@/lib/payos";

function invalidOrderCode() {
  return NextResponse.json({ error: "Invalid orderCode" }, { status: 400 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderCode = url.searchParams.get("orderCode")?.trim();
  if (!orderCode || !/^\d+$/.test(orderCode)) return invalidOrderCode();

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  if (!db) {
    return NextResponse.json({ verified: false, status: "UNKNOWN", transactionId: orderCode });
  }

  const order = await db.paymentOrder.findUnique({
    where: { orderCode: BigInt(orderCode) },
    select: {
      id: true,
      userId: true,
      orderCode: true,
      status: true,
      amountVnd: true,
      coins: true,
      paidAt: true,
      rawPayload: true,
      package: { select: { key: true } },
    },
  });
  if (!order || order.userId !== user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const payosStatus = await getPayOSPaymentRequest(orderCode).catch(() => null);
  const verifiedByPayOS = isPayOSRequestPaid(payosStatus, order.amountVnd);
  let settlement: Awaited<ReturnType<typeof settlePaidOrder>> = null;
  if (verifiedByPayOS || (order.status === "PAID" && order.paidAt)) {
    settlement = await settlePaidOrder(db, order, {
      raw: order.rawPayload,
      reconciliation: payosStatus?.raw,
    });
  }
  const verified = order.status === "PAID" && Boolean(order.paidAt) || settlement?.status === "PAID";
  if (!verified) {
    return NextResponse.json({ verified: false, status: order.status, transactionId: orderCode });
  }

  const readingMetadata = paidReadingOrderPayload(order.rawPayload);
  const readingId = settlement && "readingId" in settlement ? settlement.readingId : undefined;
  return NextResponse.json({
    verified: true,
    status: "PAID",
    transactionId: orderCode,
    value: order.amountVnd,
    currency: "VND",
    packageKey: order.package?.key,
    coins: order.coins,
    ...(readingMetadata
      ? {
          chartId: readingMetadata.chartId,
          purchaseType: "direct_full",
          readingId,
        }
      : {}),
  });
}
