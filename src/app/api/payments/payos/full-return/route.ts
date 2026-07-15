import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { APP_URL } from "@/lib/env";
import {
  getPayOSPaymentRequest,
  isPayOSRequestPaid,
  paidReadingOrderPayload,
  settlePaidOrder,
} from "@/lib/payos";

function appUrl(path: string) {
  return new URL(path, APP_URL);
}

function chartRedirect(chartId: string, params: Record<string, string>) {
  const url = appUrl(`/la-so/${chartId}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderCode = url.searchParams.get("orderCode")?.trim();
  const user = await getCurrentUser();
  if (!user || !orderCode || !/^\d+$/.test(orderCode)) {
    return NextResponse.redirect(appUrl("/la-so?checkout=invalid"));
  }

  const db = getDb();
  if (!db) return NextResponse.redirect(appUrl("/la-so?checkout=unavailable"));

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
    },
  });
  const metadata = paidReadingOrderPayload(order?.rawPayload);
  if (!order || order.userId !== user.id || !metadata || metadata.kind !== "directReading") {
    return NextResponse.redirect(appUrl("/la-so?checkout=forbidden"));
  }

  const payosStatus = await getPayOSPaymentRequest(orderCode).catch(() => null);
  const verifiedByPayOS = isPayOSRequestPaid(payosStatus, order.amountVnd);
  if (!verifiedByPayOS && (order.status !== "PAID" || !order.paidAt)) {
    return chartRedirect(metadata.chartId, { checkout: "pending" });
  }

  const settlement = await settlePaidOrder(db, order, {
    raw: order.rawPayload,
    reconciliation: payosStatus?.raw,
  });
  if (!settlement || !("readingId" in settlement)) {
    return chartRedirect(metadata.chartId, { checkout: "error" });
  }

  const advanced = appUrl(`/la-so/${metadata.chartId}/nang-cao`);
  advanced.searchParams.set("reading", settlement.readingId);
  advanced.searchParams.set("generating", "1");
  advanced.searchParams.set("status", "success");
  advanced.searchParams.set("orderCode", orderCode);
  return NextResponse.redirect(advanced);
}
