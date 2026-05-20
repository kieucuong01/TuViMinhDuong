import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createPayOSCheckout } from "@/lib/payos";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const checkout = await createPayOSCheckout(body.packageKey || "full-reading", user);
  return NextResponse.json(checkout);
}
