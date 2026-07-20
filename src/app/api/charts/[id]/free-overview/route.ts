import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getChart, getFreeOverviewStatus } from "@/lib/data";
import { buildFreeOverviewTeaser, countVisibleMarkdownWords } from "@/lib/free-overview-presentation";
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
  const canReadFullOverview = Boolean(user && (user.role === "ADMIN" || record.userId === user.id));
  const visibleContent = !canReadFullOverview && overview.status === "ready"
    ? buildFreeOverviewTeaser(overview.content)
    : overview.content;
  const visibleOverview = canReadFullOverview
    ? overview
    : {
        status: overview.status,
        source: overview.source,
        jobStatus: overview.jobStatus,
        ...(overview.status === "ready" ? { model: overview.model, generatedAt: overview.generatedAt } : {}),
        content: visibleContent,
        wordCount: countVisibleMarkdownWords(visibleContent),
      };
  logPerfEvent("free_overview_get_timing", timer.total(), {
    chartId: id,
    status: overview.status,
    jobStatus: overview.jobStatus,
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
