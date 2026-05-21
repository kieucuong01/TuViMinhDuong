import { NextResponse } from "next/server";
import { getChart, getOrCreateFreeOverview } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await getChart(id);
  if (!record) return NextResponse.json({ error: "Không tìm thấy lá số." }, { status: 404 });

  const content = await getOrCreateFreeOverview(id, record.chart);
  return NextResponse.json(
    { content },
    {
      headers: {
        "cache-control": "private, no-store",
      },
    },
  );
}
