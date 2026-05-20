import Link from "next/link";
import { ArrowRight, CalendarClock, Compass, Sparkles } from "lucide-react";
import type { TuViChart } from "@/lib/chart";

function findCurrentDecade(chart: TuViChart) {
  const age = Math.max(1, chart.input.viewYear - chart.solar.year);
  return chart.daiVan.find((period) => {
    const [start, end] = period.range.split("-").map(Number);
    return age >= start && age <= end;
  }) || chart.daiVan[0];
}

function highlightPalaces(chart: TuViChart) {
  const names = ["Mệnh", "Quan Lộc", "Tài Bạch"];
  return names
    .map((name) => chart.palaces.find((palace) => palace.name === name))
    .filter(Boolean)
    .map((palace) => ({
      title: `Cung ${palace!.name}`,
      body: `${palace!.branch} - ${palace!.mainStars.slice(0, 2).join(", ") || "chưa có chính tinh nổi bật"}`,
    }));
}

export function ChartQuickInsights({ chart, chartId }: { chart: TuViChart; chartId: string }) {
  const decade = findCurrentDecade(chart);
  const palaces = highlightPalaces(chart);
  const menh = chart.palaces.find((palace) => palace.isMenh);

  return (
    <section className="quick-insights" aria-label="Kết quả nhanh lá số">
      <div className="quick-insights-head">
        <p className="eyebrow">Kết quả nhanh</p>
        <h2>3 điểm nên xem trước trong lá số này</h2>
        <p>Lớp tóm tắt giúp người dùng không bị ngợp trước bàn lá số 12 cung.</p>
      </div>

      <div className="quick-insight-grid">
        <article>
          <span><Sparkles size={18} /></span>
          <h3>Nền mệnh</h3>
          <p>{chart.menh}, {chart.cuc}. {menh ? `Cung Mệnh nằm tại ${menh.branch}.` : "Cung Mệnh đã được an theo dữ liệu đầu vào."}</p>
        </article>
        <article>
          <span><Compass size={18} /></span>
          <h3>Cung đáng xem trước</h3>
          <p>{palaces.map((item) => `${item.title}: ${item.body}`).join(" • ")}</p>
        </article>
        <article>
          <span><CalendarClock size={18} /></span>
          <h3>Vận hạn năm {chart.input.viewYear}</h3>
          <p>{decade ? `Đang ở đại vận ${decade.range} tuổi, trọng tâm tại cung ${decade.palace}.` : "Có thể bắt đầu từ Đại vận để xem nhịp 10 năm."}</p>
        </article>
      </div>

      <div className="quick-insight-actions">
        <Link href={`/la-so/${chartId}?view=luan-cung`}>
          Luận cung <ArrowRight size={16} />
        </Link>
        <Link href={`/la-so/${chartId}?view=dai-van`}>
          Xem đại vận <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
