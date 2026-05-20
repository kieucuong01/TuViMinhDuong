import "server-only";

import { createHmac } from "node:crypto";
import { APP_URL, isPayOSEnabled } from "@/lib/env";
import { COIN_PACKAGES } from "@/lib/pricing";
import type { SessionUser } from "@/lib/auth";

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

export async function createPayOSCheckout(packageKey: string, user: SessionUser) {
  const pack = COIN_PACKAGES.find((item) => item.key === packageKey) || COIN_PACKAGES[1];
  const orderCode = Number(`${Date.now()}${Math.floor(Math.random() * 90 + 10)}`.slice(-12));
  const coins = pack.coins + pack.bonusCoins;
  const body = {
    orderCode,
    amount: pack.priceVnd,
    description: `Nap ${coins} xu`,
    buyerName: user.name,
    buyerEmail: user.email,
    returnUrl: `${APP_URL}/nap-xu?status=success&orderCode=${orderCode}`,
    cancelUrl: `${APP_URL}/nap-xu?status=cancelled&orderCode=${orderCode}`,
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
      checkoutUrl: `${APP_URL}/nap-xu?status=demo-paid&orderCode=${orderCode}`,
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
