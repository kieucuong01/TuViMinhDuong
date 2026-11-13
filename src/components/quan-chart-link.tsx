"use client";

import Link from "next/link";
import type { ChartInput } from "@/lib/chart";

export const QUAN_CHART_TRANSFER_KEY = "tu-vi-quan:chart-transfer";

export function QuanChartLink({ input }: { input: ChartInput }) {
  return <Link href="/tu-vi-quan?visit=tuvi&useChart=1" prefetch={false} className="btn btn-ghost"
    onNavigate={() => {
      try { sessionStorage.setItem(QUAN_CHART_TRANSFER_KEY, JSON.stringify(input)); } catch { /* The quán can collect the input at the table. */ }
    }}>Xem trực tiếp 3D</Link>;
}
