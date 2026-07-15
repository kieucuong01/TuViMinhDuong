import { NextResponse } from "next/server";
import { getChart, getFreeOverviewStatus } from "@/lib/data";
import { createPerfTimer } from "@/lib/perf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const timer = createPerfTimer();
  const { id } = await params;
  const record = await timer.time("getChart", () => getChart(id));
  if (!record) return NextResponse.json({ error: "Không tìm thấy lá số." }, { status: 404 });

  const overview = getFreeOverviewStatus(record.chart);
  return NextResponse.json(
    { status: overview.status, chartId: id },
    { headers: { "cache-control": "private, no-store", "server-timing": timer.serverTiming() } },
  );
}
