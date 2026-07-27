import { after, NextResponse } from "next/server";
import {
  claimFreeOverviewBlockGeneration,
  claimFreeOverviewGeneration,
  generateAndStoreFreeOverview,
  generateAndStoreFreeOverviewBlock,
  getChart,
  getFreeOverviewStatus,
} from "@/lib/data";
import { FREE_OVERVIEW_BLOCK_KEYS, type FreeOverviewBlockKey } from "@/lib/ai";
import { createPerfTimer } from "@/lib/perf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

function requestedBlock(raw: string | null): FreeOverviewBlockKey | null {
  return FREE_OVERVIEW_BLOCK_KEYS.includes(raw as FreeOverviewBlockKey) ? (raw as FreeOverviewBlockKey) : null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const timer = createPerfTimer();
  const { id } = await params;
  const rawBlock = new URL(request.url).searchParams.get("block");
  const blockKey = requestedBlock(rawBlock);
  if (rawBlock !== null && !blockKey) {
    return NextResponse.json({ error: "Block luận giải không hợp lệ." }, { status: 400 });
  }
  const record = await timer.time("getChart", () => getChart(id));
  if (!record) return NextResponse.json({ error: "Không tìm thấy lá số." }, { status: 404 });

  const overview = getFreeOverviewStatus(record.chart);
  if (overview.status === "ready" && overview.source === "llm") {
    return NextResponse.json(
      { status: "ready", chartId: id, completedBlocks: overview.completedBlocks, totalBlocks: overview.totalBlocks },
      { headers: { "cache-control": "private, no-store", "server-timing": timer.serverTiming() } },
    );
  }

  if (blockKey) {
    if (overview.nextBlockKey && overview.nextBlockKey !== blockKey) {
      return NextResponse.json(
        { error: "Block luận giải chưa đến lượt xử lý.", nextBlockKey: overview.nextBlockKey },
        { status: 409, headers: { "cache-control": "private, no-store", "server-timing": timer.serverTiming() } },
      );
    }
    const claim = await claimFreeOverviewBlockGeneration(id, record.chart, blockKey);
    if (claim.status === "claimed") {
      after(() => {
        void generateAndStoreFreeOverviewBlock(id, blockKey).catch((error) => {
          console.error("free_overview_block_generation_failed", blockKey, error);
        });
      });
    }
    return NextResponse.json(
      { status: claim.status === "ready" ? "block_ready" : "processing", chartId: id, block: blockKey },
      { status: claim.status === "ready" ? 200 : 202, headers: { "cache-control": "private, no-store", "server-timing": timer.serverTiming() } },
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
