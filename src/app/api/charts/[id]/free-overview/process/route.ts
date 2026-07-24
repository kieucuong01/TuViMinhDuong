import { after, NextResponse } from "next/server";
import { claimFreeOverviewGeneration, generateAndStoreFreeOverview, getChart, getFreeOverviewStatus } from "@/lib/data";
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
  if (overview.status === "ready" && overview.source === "llm") {
    return NextResponse.json(
      { status: "ready", chartId: id },
      { headers: { "cache-control": "private, no-store", "server-timing": timer.serverTiming() } },
    );
  }

  const claim = await claimFreeOverviewGeneration(id, record.chart);
  if (claim.status === "ready") {
    return NextResponse.json(
      { status: "ready", chartId: id },
      { headers: { "cache-control": "private, no-store", "server-timing": timer.serverTiming() } },
    );
  }
  if (claim.status === "claimed") {
    after(() => {
      void generateAndStoreFreeOverview(id, { force: true }).catch((error) => {
        console.error("free_overview_generation_failed", error);
      });
    });
  }

  return NextResponse.json(
    { status: "processing", chartId: id },
    { status: 202, headers: { "cache-control": "private, no-store", "server-timing": timer.serverTiming() } },
  );
}
