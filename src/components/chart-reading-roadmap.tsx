import Link from "next/link";
import { CalendarDays, HeartHandshake, Route, ScrollText, Wallet } from "lucide-react";
import type { TuViChart } from "@/lib/chart";

type ChartReadingRoadmapProps = {
  chartId: string;
  chart: TuViChart;
};

export function ChartReadingRoadmap({ chartId, chart }: ChartReadingRoadmapProps) {
  const viewYear = chart.input.viewYear;

  return (
    <section className="chart-reading-roadmap" aria-label="Lộ trình đọc lá số của bạn" data-testid="chart-reading-roadmap">
      <div className="chart-roadmap-head">
        <p className="eyebrow">Lộ trình đọc lá số của bạn</p>
        <h2>Đọc theo thứ tự: Mệnh → Tài Bạch / Quan Lộc / Phu Thê → vận tháng/ngày</h2>
        <span>
          Lá số của {chart.input.fullName} có Mệnh {chart.menh}, Thân {chart.than}; hãy đọc phần miễn phí trước rồi mới đi vào cung/vận đang cần.
        </span>
      </div>
      <div className="chart-roadmap-steps">
        <a href="#luan-giai">
          <ScrollText size={18} />
          <strong>1. Mệnh</strong>
          <span>Nắm khí chất chính và hướng đọc tổng quan.</span>
        </a>
        <Link href={`/la-so/${chartId}?view=luan-cung`} prefetch={false}>
          <Wallet size={18} />
          <strong>2. Tài Bạch</strong>
          <span>Đối chiếu tiền bạc, nguồn lực và cách giữ nhịp.</span>
        </Link>
        <Link href={`/la-so/${chartId}?view=luan-cung`} prefetch={false}>
          <Route size={18} />
          <strong>3. Quan Lộc</strong>
          <span>Đọc trọng tâm công việc, vai trò và hướng đi.</span>
        </Link>
        <Link href={`/la-so/${chartId}?view=luan-cung`} prefetch={false}>
          <HeartHandshake size={18} />
          <strong>4. Phu Thê</strong>
          <span>Xem cách đọc quan hệ, hôn nhân và người đồng hành.</span>
        </Link>
        <Link href={`/la-so/${chartId}?view=nguyet-van`} prefetch={false}>
          <CalendarDays size={18} />
          <strong>5. Vận tháng/ngày</strong>
          <span>Quay lại theo tháng {viewYear} và từng ngày cần chọn.</span>
        </Link>
      </div>
    </section>
  );
}
