import { buildWealthFortuneReport, type WealthYearPoint } from "@/lib/wealth-fortune";
import type { TuViChart } from "@/lib/chart";

type WealthFortuneViewProps = {
  chartId: string;
  chart: TuViChart;
};

const DECISION_FILTER_QUESTIONS = [
  "Dữ kiện nào đã được xác minh, và dữ kiện nào vẫn chỉ là giả định?",
  "Nếu giả định chính sai, mức tổn thất tối đa bạn có thể chấp nhận là bao nhiêu?",
  "Quyết định này có làm suy yếu quỹ dự phòng hoặc dòng tiền thiết yếu không?",
  "Bạn có đang phụ thuộc vào vay nợ hoặc đòn bẩy vượt quá khả năng kiểm soát không?",
  "Ai có chuyên môn phù hợp và độc lập để giúp bạn kiểm tra lại quyết định?",
  "Mốc dữ kiện nào sẽ khiến bạn dừng lại, điều chỉnh hoặc đánh giá lại?",
];

const EVIDENCE_LINKS: Record<string, string> = {
  "Tài Bạch": "/tra-cuu/cung-tai-bach",
  "Quan Lộc": "/tra-cuu/cung-quan-loc",
  "Thiên Di": "/tra-cuu/cung-thien-di",
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

function WealthTrendFigure({
  cautionYear,
  points,
  strongestYear,
}: {
  cautionYear: WealthYearPoint;
  points: WealthYearPoint[];
  strongestYear: WealthYearPoint;
}) {
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

      <div className="wealth-year-highlight-grid" aria-label="Hai mốc năm cần đối chiếu">
        <article>
          <h3>Năm thuận hơn để kiểm chứng</h3>
          <strong>{strongestYear.year} · {strongestYear.score}/100</strong>
          <p>Ưu tiên thử từng bước nhỏ và tiếp tục đối chiếu với dữ kiện thực tế.</p>
        </article>
        <article>
          <h3>Năm cần kiểm chứng nhiều hơn</h3>
          <strong>{cautionYear.year} · {cautionYear.score}/100</strong>
          <p>Rà soát giả định, giới hạn rủi ro và phương án dự phòng trước khi cam kết.</p>
        </article>
      </div>

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
        <h1 id="wealth-report-title">Bản đồ Tài - Quan - Di của {chart.input.fullName} · {chart.input.viewYear}</h1>
        <p>{report.postureSummary}</p>
        <div className="wealth-overall" aria-label={`Chỉ số định hướng tổng hợp ${report.overallScore} trên 100, ${report.postureLabel}`}>
          <span className="wealth-overall-label">Chỉ số định hướng tổng hợp</span>
          <strong>{report.overallScore}/100</strong>
          <span className="wealth-posture-label">{report.postureLabel}</span>
        </div>
      </header>

      <div className="wealth-pillar-grid">
        {report.pillars.map((pillar) => (
          <article className="wealth-pillar-card" key={pillar.key}>
            <h2>{pillar.label}</h2>
            <span className="wealth-pillar-score-label">Chỉ số định hướng</span>
            <strong>{pillar.score}/100</strong>
            <p>{pillar.summary}</p>
          </article>
        ))}
      </div>

      <WealthTrendFigure
        cautionYear={report.cautionYear}
        points={report.fiveYearTrend}
        strongestYear={report.strongestYear}
      />

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
              <p><strong>Sao hỗ trợ:</strong> {evidence.supportStars.length
                ? evidence.supportStars.join(", ")
                : evidence.available ? "Không ghi nhận sao hỗ trợ trong nhóm theo dõi" : "Chưa có dữ liệu"}</p>
              <p><strong>Điểm cần lưu ý:</strong> {evidence.cautionStars.length
                ? evidence.cautionStars.join(", ")
                : evidence.available ? "Không ghi nhận điểm cần lưu ý trong nhóm theo dõi" : "Chưa có dữ liệu"}</p>
              <a className="wealth-evidence-link" href={EVIDENCE_LINKS[evidence.palace]}>Đọc sâu về cung {evidence.palace}</a>
            </article>
          ))}
        </div>
      </section>

      <section className="wealth-action-section" aria-labelledby="wealth-action-title">
        <div className="wealth-section-heading">
          <p className="eyebrow">Gợi ý tự rà soát</p>
          <h2 id="wealth-action-title">Kế hoạch hành động 90 ngày</h2>
          <p>Ba bước theo dõi có kiểm chứng để chia mục tiêu thành việc nhỏ, có mốc xem lại.</p>
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

      <section className="wealth-decision-section" aria-labelledby="wealth-decision-title">
        <div className="wealth-section-heading">
          <p className="eyebrow">Trước quyết định lớn</p>
          <h2 id="wealth-decision-title">Bộ lọc 6 câu trước quyết định lớn</h2>
          <p>Trả lời bằng dữ kiện của bạn; nếu chưa rõ, hãy trì hoãn cam kết và tìm tư vấn chuyên môn độc lập.</p>
        </div>
        <ol className="wealth-decision-list">
          {DECISION_FILTER_QUESTIONS.map((question) => (
            <li className="wealth-decision-question" key={question}>{question}</li>
          ))}
        </ol>
      </section>

      <p className="wealth-disclaimer" role="note" aria-label="Nội dung này không thay thế tư vấn tài chính.">{report.disclaimer}</p>
    </section>
  );
}
