import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCachedReading } from "@/lib/data";
import type { ReadingKey } from "@/lib/pricing";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const chartId = url.searchParams.get("chartId") || "";
  const type = (url.searchParams.get("type") || "FULL") as ReadingKey;
  const scopeKey = url.searchParams.get("scopeKey") || "all";
  const reading = await getCachedReading(user.id, chartId, type, scopeKey);
  return NextResponse.json({ reading });
}
