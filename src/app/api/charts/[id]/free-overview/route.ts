import { NextResponse } from "next/server";
import { getChart, getFreeOverviewStatus } from "@/lib/data";
import { createPerfTimer, logPerfEvent } from "@/lib/perf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const timer = createPerfTimer();
  const { id } = await params;
  const record = await timer.time("getChart", () => getChart(id));
  if (!record) return NextResponse.json({ error: "Không tìm thấy lá số." }, { status: 404 });

  const overview = await timer.time("overviewStatus", () => getFreeOverviewStatus(record.chart));
  logPerfEvent("free_overview_get_timing", timer.total(), {
    chartId: id,
    status: overview.status,
    jobStatus: overview.jobStatus,
    timings: timer.timings(),
  });

  return NextResponse.json(
    overview,
    {
      headers: {
        "cache-control": "private, no-store",
        "server-timing": timer.serverTiming(),
      },
    },
  );
}
