import { revalidatePath } from "next/cache";
import { after, NextResponse } from "next/server";
import {
  claimFreeOverviewGeneration,
  failFreeOverviewGeneration,
  generateAndStoreFreeOverview,
  getChart,
  getFreeOverviewStatus,
} from "@/lib/data";
import { createPerfTimer, logPerfEvent } from "@/lib/perf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const globalFreeOverviewJobs = globalThis as unknown as {
  freeOverviewJobLocks?: Set<string>;
};

function freeOverviewJobLocks() {
  globalFreeOverviewJobs.freeOverviewJobLocks ||= new Set();
  return globalFreeOverviewJobs.freeOverviewJobLocks;
}

async function runFreeOverviewJob(chartId: string) {
  try {
    await generateAndStoreFreeOverview(chartId);
    revalidatePath(`/la-so/${chartId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Khong tao duoc tong quan mien phi.";
    await failFreeOverviewGeneration(chartId, message);
  } finally {
    freeOverviewJobLocks().delete(chartId);
  }
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const timer = createPerfTimer();
  const { id } = await params;
  const record = await timer.time("getChart", () => getChart(id));
  if (!record) return NextResponse.json({ error: "Không tìm thấy lá số." }, { status: 404 });

  const current = getFreeOverviewStatus(record.chart);
  if (current.status === "ready") {
    return NextResponse.json(
      { status: "ready", chartId: id },
      { headers: { "cache-control": "private, no-store", "server-timing": timer.serverTiming() } },
    );
  }

  const locks = freeOverviewJobLocks();
  if (locks.has(id)) {
    return NextResponse.json(
      { status: "processing", chartId: id },
      { status: 202, headers: { "cache-control": "private, no-store", "server-timing": timer.serverTiming() } },
    );
  }

  const claim = await timer.time("claimJob", () => claimFreeOverviewGeneration(id, record.chart));
  if (claim.status === "ready") {
    return NextResponse.json(
      { status: "ready", chartId: id },
      { headers: { "cache-control": "private, no-store", "server-timing": timer.serverTiming() } },
    );
  }
  if (claim.status === "processing") {
    return NextResponse.json(
      { status: "processing", chartId: id },
      { status: 202, headers: { "cache-control": "private, no-store", "server-timing": timer.serverTiming() } },
    );
  }

  locks.add(id);
  after(() => runFreeOverviewJob(id));
  logPerfEvent("free_overview_process_timing", timer.total(), {
    chartId: id,
    status: "scheduled",
    timings: timer.timings(),
  });

  return NextResponse.json(
    { status: "processing", chartId: id },
    { status: 202, headers: { "cache-control": "private, no-store", "server-timing": timer.serverTiming() } },
  );
}
