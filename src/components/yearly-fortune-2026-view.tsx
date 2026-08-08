import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Compass,
  Heart,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";
import type { TuViChart } from "@/lib/chart";
import { buildYearlyFortune2026Report, type YearlyFortuneAreaKey } from "@/lib/yearly-fortune-2026";

type YearlyFortune2026ViewProps = {
  chartId: string;
  chart: TuViChart;
};

const AREA_ICONS = {
  career: BriefcaseBusiness,
  money: WalletCards,
  love: Heart,
  health: Activity,
  relations: UsersRound,
} satisfies Record<YearlyFortuneAreaKey, typeof BriefcaseBusiness>;

const RELATED_TOOLS = [
  {
    href: "/tu-vi-tai-loc-dau-tu",
    title: "Đọc sâu Tài–Quan–Di",
    body: "Đối chiếu riêng công việc, dòng tiền và môi trường phát triển trong 5 năm.",
  },
  {
    href: "/xem-ngay",
    title: "Chọn ngày cho việc cụ thể",
    body: "Khi đã có kế hoạch, xem thêm ngày phù hợp theo tuổi và mục đích sử dụng.",
  },
  {
    href: "/xem-tuoi",
    title: "Đối chiếu tuổi và việc lớn",
    body: "Xem riêng chuyện hợp tác, kết hôn, làm nhà hoặc các mốc cần cân nhắc.",
  },
];

export function YearlyFortune2026View({ chartId, chart }: YearlyFortune2026ViewProps) {
  const report = buildYearlyFortune2026Report(chart);

  return (
    <article className="annual-report" data-chart-id={chartId} aria-labelledby="annual-report-title">
      <header className="annual-report-hero">
        <div className="annual-report-kicker"><CalendarDays size={19} aria-hidden="true" /> Bản đọc cá nhân năm Bính Ngọ</div>
        <h1 id="annual-report-title">Tử vi năm 2026 của {chart.input.fullName}</h1>
        <p className="annual-report-meta">Tuổi âm {report.lunarAge} · {chart.canChi.year} · {chart.input.gender === "female" ? "Nữ mạng" : "Nam mạng"}</p>
        <div className="annual-report-overall">
          <div>
            <span>Chỉ số định hướng năm</span>
            <strong>{report.overallScore}/100</strong>
          </div>
          <p>{report.overallLabel}</p>
        </div>
      </header>

      <section className="annual-report-opening" aria-labelledby="annual-opening-title">
        <p className="eyebrow">Bức tranh chung</p>
        <h2 id="annual-opening-title">Năm nay nên tiến ở đâu, giữ nhịp ở đâu?</h2>
        <p>{report.opening}</p>
      </section>

      <section className="annual-area-section" aria-labelledby="annual-areas-title">
        <div className="annual-section-heading">
          <p className="eyebrow">Năm phương diện đáng quan tâm</p>
          <h2 id="annual-areas-title">Luận giải đi từ lá số đến việc có thể làm</h2>
          <p>Mỗi phần nối dữ liệu cung sao với biểu hiện đời sống và một bước tự kiểm chứng. Điểm số chỉ giúp sắp thứ tự ưu tiên, không phải xác suất xảy ra sự kiện.</p>
        </div>

        <div className="annual-area-grid">
          {report.areas.map((area) => {
            const Icon = AREA_ICONS[area.key];
            return (
              <article className="annual-area-card" key={area.key}>
                <header>
                  <span className="annual-area-icon"><Icon size={22} aria-hidden="true" /></span>
                  <div>
                    <h3>{area.title}</h3>
                    <p>{area.label}</p>
                  </div>
                  <strong aria-label={`Chỉ số định hướng ${area.score} trên 100`}>{area.score}</strong>
                </header>
                <progress value={area.score} max="100" aria-label={`Mức định hướng cho ${area.title}`} />
                <p className="annual-area-body">{area.body}</p>
                <p className="annual-area-action"><Compass size={18} aria-hidden="true" /><span><b>Việc nên làm:</b> {area.action}</span></p>
                <details className="annual-evidence-details">
                  <summary>Căn cứ lá số</summary>
                  <div>
                    {area.evidence.map((evidence) => (
                      <section key={`${area.key}-${evidence.palace}`}>
                        <h4>{evidence.palace}{evidence.available ? ` · ${evidence.branch}` : ""}</h4>
                        <p>{evidence.summary}</p>
                        {evidence.yearlyStars.length ? <p><b>Sao lưu năm:</b> {evidence.yearlyStars.join(", ")}</p> : null}
                      </section>
                    ))}
                  </div>
                </details>
              </article>
            );
          })}
        </div>
      </section>

      <section className="annual-timeline-section" aria-labelledby="annual-timeline-title">
        <div className="annual-section-heading">
          <p className="eyebrow">Nhịp 12 tháng</p>
          <h2 id="annual-timeline-title">Bốn chặng để dễ lập kế hoạch hơn</h2>
          <p>Đây là lịch tự rà soát theo quý, không phải lời khẳng định một sự kiện chắc chắn sẽ xảy ra trong tháng nào.</p>
        </div>
        <ol className="annual-timeline">
          {report.seasons.map((season, index) => (
            <li key={season.key}>
              <span className="annual-timeline-number">{index + 1}</span>
              <div>
                <p>{season.tone}</p>
                <h3>{season.title}</h3>
                <p>{season.body}</p>
                <strong>{season.focus}</strong>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="annual-action-section" aria-labelledby="annual-action-title">
        <div className="annual-section-heading">
          <p className="eyebrow">Đưa phần luận vào đời sống</p>
          <h2 id="annual-action-title">Ba mốc để không đọc xong rồi bỏ đó</h2>
        </div>
        <ol>
          {report.actionPlan.map((step, index) => (
            <li key={step.title}>
              <span>{index + 1}</span>
              <div><h3>{step.title}</h3><p>{step.body}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="annual-related-section" aria-labelledby="annual-related-title">
        <div className="annual-section-heading">
          <p className="eyebrow">Khi cần xem sâu hơn</p>
          <h2 id="annual-related-title">Chọn đúng công cụ cho câu hỏi tiếp theo</h2>
        </div>
        <div>
          {RELATED_TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              data-organic-click="annual_2026_related_tool_click"
              data-organic-target={tool.href}
            >
              <span><strong>{tool.title}</strong><small>{tool.body}</small></span>
              <ArrowRight size={19} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <aside className="annual-disclaimer" aria-label="Giới hạn của phần luận">
        <ShieldCheck size={24} aria-hidden="true" />
        <div>
          <h2>Chỉ mang tính tham khảo</h2>
          <p>{report.disclaimer}</p>
          <Link href="/phuong-phap-luan">Xem phương pháp luận</Link>
        </div>
      </aside>
    </article>
  );
}
