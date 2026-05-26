import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOperationSettings } from "@/lib/data";
import { createPayOSCheckout } from "@/lib/payos";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const operationSettings = await getOperationSettings();
  if (!operationSettings.paymentsEnabled || !operationSettings.coinTopupEnabled) {
    return NextResponse.json({ error: "Payment is disabled" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const checkout = await createPayOSCheckout(body.packageKey || "full-reading", user);
  return NextResponse.json(checkout);
}
