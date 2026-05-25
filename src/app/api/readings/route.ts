import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getReadingJobByScope } from "@/lib/data";
import type { ReadingKey } from "@/lib/pricing";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const chartId = url.searchParams.get("chartId") || "";
  const type = (url.searchParams.get("type") || "FULL") as ReadingKey;
  const scopeKey = url.searchParams.get("scopeKey") || "all";
  const reading = await getReadingJobByScope(user.id, chartId, type, scopeKey);
  if (!reading) return NextResponse.json({ status: "missing", reading: null });
  if (reading.status === "COMPLETED" && reading.content) {
    return NextResponse.json({ status: "ready", reading });
  }
  if (reading.status === "FAILED" || reading.status === "REFUNDED") {
    return NextResponse.json({
      status: "failed",
      refunded: reading.status === "REFUNDED",
      readingId: reading.id,
      error: reading.error || "Không tạo được luận giải. Vui lòng thử lại sau.",
      progress: reading.promptMeta,
    });
  }
  return NextResponse.json({
    status: "pending",
    readingId: reading.id,
    progress: reading.promptMeta,
  });
}
