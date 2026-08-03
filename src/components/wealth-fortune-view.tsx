import { buildWealthFortuneReport, type WealthYearPoint } from "@/lib/wealth-fortune";
import type { TuViChart } from "@/lib/chart";

type WealthFortuneViewProps = {
  chartId: string;
  chart: TuViChart;
};

function trendCoordinates(points: WealthYearPoint[]) {
  const width = 560;
  const left = 40;
  const bottom = 214;
  const chartHeight = 154;
  const step = width / Math.max(points.length - 1, 1);

  return points.map((point, index) => ({
    ...point,
    x: left + step * index,
    y: bottom - (point.score / 100) * chartHeight,
  }));
}

function WealthTrendFigure({ points }: { points: WealthYearPoint[] }) {
  const coordinates = trendCoordinates(points);
  const polyline = coordinates.map(({ x, y }) => `${x},${y}`).join(" ");

  return (
    <section className="wealth-trend-section" aria-labelledby="wealth-trend-title">
      <div className="wealth-section-heading">
        <p className="eyebrow">Góc nhìn 5 năm</p>
        <h2 id="wealth-trend-title">Chỉ số định hướng theo từng năm</h2>
        <p id="wealth-trend-description">Các điểm thể hiện nhịp tham khảo để theo dõi và kiểm chứng, không phải dự báo kết quả tài chính.</p>
      </div>

      <figure className="wealth-trend-figure">
        <svg
          aria-labelledby="wealth-trend-svg-title wealth-trend-description"
          className="wealth-trend-chart"
          role="img"
          viewBox="0 0 640 260"
        >
          <title id="wealth-trend-svg-title">Biểu đồ Chỉ số định hướng 5 năm</title>
          <line x1="40" x2="600" y1="60" y2="60" className="wealth-trend-grid" />
          <line x1="40" x2="600" y1="137" y2="137" className="wealth-trend-grid" />
          <line x1="40" x2="600" y1="214" y2="214" className="wealth-trend-grid" />
          <polyline className="wealth-trend-line" points={polyline} />
          {coordinates.map((point) => (
            <g key={point.year}>
              <circle className="wealth-trend-point" cx={point.x} cy={point.y} r="5" />
              <text className="wealth-trend-score" x={point.x} y={point.y - 12} textAnchor="middle">{point.score}</text>
              <text className="wealth-trend-year" x={point.x} y="240" textAnchor="middle">{point.year}</text>
            </g>
          ))}
        </svg>
        <figcaption>Điểm cao hoặc thấp chỉ dùng để gợi ý thứ tự rà soát; hãy đối chiếu với dữ kiện thực tế của bạn.</figcaption>
      </figure>

      <div className="wealth-trend-table-wrap">
        <table className="wealth-trend-table">
          <caption>Bảng chỉ số định hướng 5 năm</caption>
          <thead>
            <tr>
              <th scope="col">Năm</th>
              <th scope="col">Chỉ số định hướng</th>
              <th scope="col">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.year}>
                <th scope="row">{point.year}</th>
                <td>{point.score}/100</td>
                <td>{point.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function WealthFortuneView({ chartId, chart }: WealthFortuneViewProps) {
  const report = buildWealthFortuneReport(chart);

  return (
    <section className="wealth-report" aria-labelledby="wealth-report-title" data-chart-id={chartId}>
      <header className="wealth-report-hero">
        <p className="eyebrow">Tử vi tài lộc &amp; Đầu tư</p>
        <h1 id="wealth-report-title">Bản đồ Tài - Quan - Di của {chart.input.fullName}</h1>
        <p>{report.postureSummary}</p>
      </header>

      <div className="wealth-pillar-grid">
        {report.pillars.map((pillar) => (
          <article className="wealth-pillar-card" key={pillar.key}>
            <h2>{pillar.label}</h2>
            <strong>{pillar.score}/100</strong>
            <p>{pillar.summary}</p>
          </article>
        ))}
      </div>

      <WealthTrendFigure points={report.fiveYearTrend} />

      <section className="wealth-evidence-section" aria-labelledby="wealth-evidence-title">
        <div className="wealth-section-heading">
          <p className="eyebrow">Dữ kiện lá số</p>
          <h2 id="wealth-evidence-title">Ba cung làm căn cứ tham khảo</h2>
        </div>
        <div className="wealth-evidence-grid">
          {report.palaceEvidence.map((evidence) => (
            <article className="wealth-evidence-card" key={evidence.palace}>
              <h3>{evidence.palace}</h3>
              <p className="wealth-evidence-branch">Địa chi {evidence.branch}</p>
              <p><strong>Chính tinh:</strong> {evidence.mainStars.join(", ")}</p>
              {evidence.supportStars.length ? <p><strong>Sao hỗ trợ:</strong> {evidence.supportStars.join(", ")}</p> : null}
              {evidence.cautionStars.length ? <p><strong>Điểm cần lưu ý:</strong> {evidence.cautionStars.join(", ")}</p> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="wealth-action-section" aria-labelledby="wealth-action-title">
        <div className="wealth-section-heading">
          <p className="eyebrow">Gợi ý tự rà soát</p>
          <h2 id="wealth-action-title">Ba bước theo dõi có kiểm chứng</h2>
        </div>
        <ol className="wealth-action-list">
          {report.actionPlan.map((step) => (
            <li key={step.title}>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <p className="wealth-disclaimer" role="note" aria-label="Nội dung này không thay thế tư vấn tài chính.">{report.disclaimer}</p>
    </section>
  );
}
