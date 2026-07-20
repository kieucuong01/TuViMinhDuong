import "server-only";

import { createHmac } from "node:crypto";
import { APP_URL, isPayOSEnabled } from "@/lib/env";
import { COIN_PACKAGES } from "@/lib/pricing";
import type { SessionUser } from "@/lib/auth";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";

function checksumKey() {
  return process.env.PAYOS_CHECKSUM_KEY || "demo";
}

function sortedQuery(data: Record<string, unknown>) {
  return Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join("&");
}

export function signPayOSData(data: Record<string, unknown>) {
  return createHmac("sha256", checksumKey()).update(sortedQuery(data)).digest("hex");
}

export function verifyPayOSWebhook(data: Record<string, unknown>, signature?: string) {
  if (!signature) return false;
  return signPayOSData(data) === signature;
}

type PayOSPaymentRequestStatus = {
  status?: string;
  amount?: number;
  amountPaid?: number;
  raw: unknown;
};

type TopupPaymentOrder = {
  id: string;
  userId: string;
  orderCode: bigint;
  amountVnd: number;
  coins: number;
  status: string;
  rawPayload?: unknown;
};

export async function getPayOSPaymentRequest(orderCode: string | number | bigint): Promise<PayOSPaymentRequestStatus | null> {
  if (!isPayOSEnabled()) return null;
  const response = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${orderCode}`, {
    headers: {
      "x-client-id": process.env.PAYOS_CLIENT_ID || "",
      "x-api-key": process.env.PAYOS_API_KEY || "",
    },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const json = await response.json().catch(() => null);
  if (!json || typeof json !== "object") return null;
  const data = (json as { data?: { status?: unknown; amount?: unknown; amountPaid?: unknown } }).data;
  return {
    status: typeof data?.status === "string" ? data.status : undefined,
    amount: Number(data?.amount || 0),
    amountPaid: Number(data?.amountPaid || 0),
    raw: json,
  };
}

export function isPayOSRequestPaid(payment: PayOSPaymentRequestStatus | null, expectedAmountVnd: number) {
  if (!payment) return false;
  return payment.status === "PAID" && Number(payment.amountPaid || 0) >= expectedAmountVnd;
}

export async function creditPaidTopupOrder(db: PrismaClient, order: TopupPaymentOrder, rawPayload: unknown, paidAt = new Date()) {
  return db.$transaction(async (tx) => {
    const fresh = await tx.paymentOrder.findUnique({
      where: { id: order.id },
      select: {
        id: true,
        userId: true,
        orderCode: true,
        amountVnd: true,
        coins: true,
        status: true,
        paidAt: true,
        package: { select: { key: true } },
      },
    });
    if (!fresh) return null;

    if (fresh.status !== "PAID" || !fresh.paidAt) {
      await tx.paymentOrder.update({
        where: { id: fresh.id },
        data: { status: "PAID", paidAt, rawPayload: rawPayload as Prisma.InputJsonValue },
      });
    }

    if (fresh.coins > 0) {
      const existingCredits = await tx.coinLedger.findMany({
        where: { referenceId: fresh.id, type: "CREDIT" },
        select: { amount: true },
      });
      if (existingCredits.length === 0) {
        const user = await tx.user.findUniqueOrThrow({ where: { id: fresh.userId }, select: { coinBalance: true } });
        const balance = user.coinBalance + fresh.coins;
        await tx.user.update({ where: { id: fresh.userId }, data: { coinBalance: balance } });
        await tx.coinLedger.create({
          data: {
            userId: fresh.userId,
            type: "CREDIT",
            amount: fresh.coins,
            balance,
            reason: "Nạp xu PayOS",
            referenceId: fresh.id,
          },
        });
      }
    }

    return tx.paymentOrder.findUnique({
      where: { id: fresh.id },
      select: {
        userId: true,
        status: true,
        amountVnd: true,
        coins: true,
        paidAt: true,
        package: { select: { key: true } },
      },
    });
  });
}

export type PaidReadingOrderMetadata = {
  chartId: string;
  type: "FULL";
  scopeKey: "all";
};

export type PaidReadingOrderPayload = PaidReadingOrderMetadata & {
  kind: "directReading" | "quickReading";
};

export function paidReadingOrderPayload(rawPayload: unknown): PaidReadingOrderPayload | null {
  if (!rawPayload || typeof rawPayload !== "object") return null;
  for (const kind of ["directReading", "quickReading"] as const) {
    if (!(kind in rawPayload)) continue;
    const value = (rawPayload as Record<string, unknown>)[kind];
    if (!value || typeof value !== "object") continue;
    const payload = value as Record<string, unknown>;
    if (typeof payload.chartId !== "string" || payload.type !== "FULL" || payload.scopeKey !== "all") continue;
    return { kind, chartId: payload.chartId, type: "FULL", scopeKey: "all" };
  }
  return null;
}

export async function completePaidReadingOrder(
  db: PrismaClient,
  order: TopupPaymentOrder,
  rawPayload: unknown,
  paidAt = new Date(),
) {
  return db.$transaction(async (tx) => {
    const fresh = await tx.paymentOrder.findUnique({
      where: { id: order.id },
      select: {
        id: true,
        userId: true,
        orderCode: true,
        amountVnd: true,
        coins: true,
        status: true,
        paidAt: true,
        rawPayload: true,
      },
    });
    if (!fresh) return null;

    const metadata = paidReadingOrderPayload(fresh.rawPayload ?? order.rawPayload);
    if (!metadata) return null;
    const metadataValue = {
      chartId: metadata.chartId,
      type: metadata.type,
      scopeKey: metadata.scopeKey,
    };

    await tx.paymentOrder.update({
      where: { id: fresh.id },
      data: {
        status: "PAID",
        paidAt: fresh.paidAt || paidAt,
        rawPayload: {
          raw: rawPayload,
          [metadata.kind]: metadataValue,
        } as Prisma.InputJsonValue,
      },
    });

    const uniqueReading = {
      userId_chartId_type_scopeKey: {
        userId: fresh.userId,
        chartId: metadata.chartId,
        type: metadata.type,
        scopeKey: metadata.scopeKey,
      },
    };
    let reading = await tx.reading.findUnique({ where: uniqueReading });
    if (!reading) {
      reading = await tx.reading.create({
        data: {
          userId: fresh.userId,
          chartId: metadata.chartId,
          type: metadata.type,
          scopeKey: metadata.scopeKey,
          status: "PENDING",
          priceCoins: 0,
          content: null,
          promptMeta: {
            type: metadata.type,
            scopeKey: metadata.scopeKey,
            source: metadata.kind === "directReading" ? "direct-full-checkout" : "quick-email-checkout",
            paymentOrderId: fresh.id,
          },
        },
      });
    } else if (reading.status === "FAILED" || reading.status === "REFUNDED") {
      const previousPromptMeta =
        reading.promptMeta && typeof reading.promptMeta === "object" && !Array.isArray(reading.promptMeta)
          ? (reading.promptMeta as Record<string, unknown>)
          : {};
      reading = await tx.reading.update({
        where: { id: reading.id },
        data: {
          status: "PENDING",
          priceCoins: 0,
          content: null,
          error: null,
          promptMeta: {
            type: metadata.type,
            scopeKey: metadata.scopeKey,
            source: metadata.kind === "directReading" ? "direct-full-checkout" : "quick-email-checkout",
            ...previousPromptMeta,
            paymentOrderId: fresh.id,
          },
        },
      });
    }

    return {
      orderId: fresh.id,
      userId: fresh.userId,
      status: "PAID" as const,
      amountVnd: fresh.amountVnd,
      coins: fresh.coins,
      paidAt: fresh.paidAt || paidAt,
      readingId: reading.id,
      chartId: metadata.chartId,
      purchaseType: "direct_full" as const,
    };
  });
}

type PaidFullReadingRetryCandidate = {
  id: string;
  userId: string;
  chartId: string;
  type: string;
  scopeKey: string;
  status?: string;
  promptMeta?: unknown;
};

export async function retryPaidFullReading(
  db: PrismaClient,
  userId: string,
  chartId: string,
  reading: PaidFullReadingRetryCandidate,
) {
  if (
    reading.status !== "FAILED" ||
    reading.userId !== userId ||
    reading.chartId !== chartId ||
    reading.type !== "FULL" ||
    reading.scopeKey !== "all"
  ) return null;

  const promptMeta = reading.promptMeta;
  const paymentOrderId = promptMeta && typeof promptMeta === "object" && !Array.isArray(promptMeta)
    ? (promptMeta as Record<string, unknown>).paymentOrderId
    : null;
  if (typeof paymentOrderId !== "string" || !paymentOrderId) return null;

  const order = await db.paymentOrder.findFirst({
    where: { id: paymentOrderId, userId, status: "PAID", paidAt: { not: null } },
  });
  if (!order || order.userId !== userId || order.status !== "PAID" || !order.paidAt) return null;

  const metadata = paidReadingOrderPayload(order.rawPayload);
  if (!metadata || metadata.chartId !== chartId || metadata.type !== "FULL" || metadata.scopeKey !== "all") return null;

  const settled = await completePaidReadingOrder(db, order, order.rawPayload);
  return settled?.readingId === reading.id ? settled : null;
}

export async function settlePaidOrder(
  db: PrismaClient,
  order: TopupPaymentOrder,
  rawPayload: unknown,
  paidAt = new Date(),
) {
  return paidReadingOrderPayload(order.rawPayload)
    ? completePaidReadingOrder(db, order, rawPayload, paidAt)
    : creditPaidTopupOrder(db, order, rawPayload, paidAt);
}

function normalizeReturnPath(returnPath?: string) {
  if (!returnPath || !returnPath.startsWith("/") || returnPath.startsWith("//")) return "/nap-xu";
  return returnPath;
}

type CheckoutInput = {
  amountVnd: number;
  description: string;
  itemName: string;
  buyerName?: string | null;
  buyerEmail?: string | null;
  returnPath: string;
  cancelPath: string;
};

export async function createPayOSCustomCheckout(input: CheckoutInput) {
  const orderCode = Number(`${Date.now()}${Math.floor(Math.random() * 90 + 10)}`.slice(-12));
  const returnPath = normalizeReturnPath(input.returnPath);
  const cancelPath = normalizeReturnPath(input.cancelPath);
  const returnJoin = returnPath.includes("?") ? "&" : "?";
  const cancelJoin = cancelPath.includes("?") ? "&" : "?";
  const successUrl = `${APP_URL}${returnPath}${returnJoin}status=success&orderCode=${orderCode}`;
  const cancelledUrl = `${APP_URL}${cancelPath}${cancelJoin}status=cancelled&orderCode=${orderCode}`;
  const body = {
    orderCode,
    amount: input.amountVnd,
    description: input.description.slice(0, 25),
    buyerName: input.buyerName || undefined,
    buyerEmail: input.buyerEmail || undefined,
    returnUrl: successUrl,
    cancelUrl: cancelledUrl,
    items: [{ name: input.itemName, quantity: 1, price: input.amountVnd }],
  };
  const signature = signPayOSData({
    amount: body.amount,
    cancelUrl: body.cancelUrl,
    description: body.description,
    orderCode: body.orderCode,
    returnUrl: body.returnUrl,
  });

  if (!isPayOSEnabled()) {
    return {
      orderCode,
      amountVnd: input.amountVnd,
      checkoutUrl: successUrl,
      paymentLinkId: `demo-${orderCode}`,
      raw: { ...body, signature, mode: "demo" },
    };
  }

  const response = await fetch("https://api-merchant.payos.vn/v2/payment-requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": process.env.PAYOS_CLIENT_ID || "",
      "x-api-key": process.env.PAYOS_API_KEY || "",
    },
    body: JSON.stringify({ ...body, signature }),
  });

  if (!response.ok) {
    throw new Error("Không tạo được link thanh toán PayOS.");
  }

  const json = await response.json();
  return {
    orderCode,
    amountVnd: input.amountVnd,
    checkoutUrl: json.data?.checkoutUrl || successUrl,
    paymentLinkId: json.data?.paymentLinkId,
    raw: json,
  };
}

export async function createPayOSCheckout(packageKey: string, user: SessionUser, returnPath?: string) {
  const pack = COIN_PACKAGES.find((item) => item.key === packageKey) || COIN_PACKAGES[1];
  const orderCode = Number(`${Date.now()}${Math.floor(Math.random() * 90 + 10)}`.slice(-12));
  const coins = pack.coins + pack.bonusCoins;
  const safeReturnPath = normalizeReturnPath(returnPath);
  const statusJoin = safeReturnPath.includes("?") ? "&" : "?";
  const successUrl = `${APP_URL}${safeReturnPath}${statusJoin}status=success&orderCode=${orderCode}`;
  const cancelUrl = `${APP_URL}${safeReturnPath}${statusJoin}status=cancelled&orderCode=${orderCode}`;
  const body = {
    orderCode,
    amount: pack.priceVnd,
    description: `Nap ${coins} xu`,
    buyerName: user.name,
    buyerEmail: user.email,
    returnUrl: successUrl,
    cancelUrl,
    items: [{ name: pack.label, quantity: 1, price: pack.priceVnd }],
  };
  const signature = signPayOSData({
    amount: body.amount,
    cancelUrl: body.cancelUrl,
    description: body.description,
    orderCode: body.orderCode,
    returnUrl: body.returnUrl,
  });

  if (!isPayOSEnabled()) {
    return {
      orderCode,
      coins,
      amountVnd: pack.priceVnd,
      checkoutUrl: `${APP_URL}${safeReturnPath}${statusJoin}status=demo-paid&orderCode=${orderCode}`,
      paymentLinkId: `demo-${orderCode}`,
      raw: { ...body, signature, mode: "demo" },
    };
  }

  const response = await fetch("https://api-merchant.payos.vn/v2/payment-requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": process.env.PAYOS_CLIENT_ID || "",
      "x-api-key": process.env.PAYOS_API_KEY || "",
    },
    body: JSON.stringify({ ...body, signature }),
  });

  if (!response.ok) {
    throw new Error("Không tạo được link thanh toán PayOS.");
  }

  const json = await response.json();
  return {
    orderCode,
    coins,
    amountVnd: pack.priceVnd,
    checkoutUrl: json.data?.checkoutUrl || `${APP_URL}/nap-xu`,
    paymentLinkId: json.data?.paymentLinkId,
    raw: json,
  };
}
