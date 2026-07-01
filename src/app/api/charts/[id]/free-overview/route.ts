import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { countWords } from "@/lib/ai";
import { getChart, getFreeOverviewStatus } from "@/lib/data";
import { buildFreeOverviewTeaser } from "@/lib/free-overview-presentation";
import { createPerfTimer, logPerfEvent } from "@/lib/perf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const timer = createPerfTimer();
  const userPromise = timer.time("getCurrentUser", () => getCurrentUser());
  const { id } = await params;
  const record = await timer.time("getChart", () => getChart(id));
  if (!record) return NextResponse.json({ error: "Không tìm thấy lá số." }, { status: 404 });

  const [overview, user] = await Promise.all([
    timer.time("overviewStatus", () => getFreeOverviewStatus(record.chart)),
    userPromise,
  ]);
  const guestContent = !user ? buildFreeOverviewTeaser(overview.content) : null;
  const visibleOverview = guestContent
    ? { ...overview, content: guestContent, wordCount: countWords(guestContent) }
    : overview;
  logPerfEvent("free_overview_get_timing", timer.total(), {
    chartId: id,
    status: visibleOverview.status,
    jobStatus: visibleOverview.jobStatus,
    timings: timer.timings(),
  });

  return NextResponse.json(
    visibleOverview,
    {
      headers: {
        "cache-control": "private, no-store",
        "server-timing": timer.serverTiming(),
      },
    },
  );
}
