import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

function invalidOrderCode() {
  return NextResponse.json({ error: "Invalid orderCode" }, { status: 400 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderCode = url.searchParams.get("orderCode")?.trim();

  if (!orderCode || !/^\d+$/.test(orderCode)) {
    return invalidOrderCode();
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({
      verified: false,
      status: "UNKNOWN",
      transactionId: orderCode,
    });
  }

  const order = await db.paymentOrder.findUnique({
    where: { orderCode: BigInt(orderCode) },
    select: {
      userId: true,
      status: true,
      amountVnd: true,
      coins: true,
      paidAt: true,
      package: {
        select: {
          key: true,
        },
      },
    },
  });

  if (!order || order.userId !== user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "PAID" || !order.paidAt) {
    return NextResponse.json({
      verified: false,
      status: order.status,
      transactionId: orderCode,
    });
  }

  return NextResponse.json({
    verified: true,
    status: order.status,
    transactionId: orderCode,
    value: order.amountVnd,
    currency: "VND",
    packageKey: order.package?.key,
    coins: order.coins,
  });
}
