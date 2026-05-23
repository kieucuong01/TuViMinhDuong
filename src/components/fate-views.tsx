import { BarChart3, CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { requestReadingAction } from "@/app/actions";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { MarkdownContent } from "@/components/markdown-content";
import { getCompletedReadingsForScopes } from "@/lib/data";
import type { StoredReading } from "@/lib/data";
import { formatCoins } from "@/lib/format";
import { getDailyFateItem, getDailyMonthTrend, getMajorFateItems, getMinorFateItems, getMonthlyFateItems, type FateReadingItem } from "@/lib/fate-analysis";
import { FEATURE_PRICES } from "@/lib/pricing";
import type { SessionUser } from "@/lib/auth";
import type { TuViChart } from "@/lib/chart";

type FateViewProps = {
  chartId: string;
  chart: TuViChart;
  user: SessionUser | null;
  activeReadingId?: string;
};

function anchorId(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function OpenButton({ chartId, item, nextPath }: { chartId: string; item: FateReadingItem; nextPath: string }) {
  const anchor = anchorId(item.scopeKey);
  return (
    <form className="fate-open-action" action={requestReadingAction} data-loading-message="Đang mở phần luận giải..." data-loading-label="Đang mở...">
      <input type="hidden" name="chartId" value={chartId} />
      <input type="hidden" name="type" value={item.type} />
      <input type="hidden" name="scopeKey" value={item.scopeKey} />
      <input type="hidden" name="next" value={`${nextPath}#${anchor}-reading`} />
      <LoadingSubmitButton className="fate-open-button" loadingText="Đang mở...">
        <LockKeyhole size={16} /> Đọc chi tiết - {formatCoins(FEATURE_PRICES[item.type].priceCoins)}
      </LoadingSubmitButton>
      <small>Mở một lần, xem lại trong tài khoản.</small>
    </form>
  );
}

function FateHero({
  title,
  description,
  price,
  children,
}: {
  title: string;
  description: string;
  price: string;
  children?: ReactNode;
}) {
  return (
    <header className={children ? "fate-hero" : "fate-hero compact"}>
      <div className="fate-hero-copy">
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="fate-hero-points" aria-label="Giá trị khi mở khóa">
          <span><Sparkles size={15} /> Có preview miễn phí trước khi mở</span>
          <span><CheckCircle2 size={15} /> Mua một lần, xem lại sau</span>
          <span><LockKeyhole size={15} /> Giá từ {price}</span>
        </div>
      </div>
      {children ? <div className="fate-hero-visual">{children}</div> : null}
    </header>
  );
}

function TrendBars({ items, currentIndex }: { items: { label: string; good: number; challenge: number }[]; currentIndex?: number }) {
  return (
    <div className="fate-chart">
      <div className="fate-chart-legend">
        <span className="inline-flex items-center gap-1"><i className="bg-emerald-400" /> Thuận lợi</span>
        <span className="inline-flex items-center gap-1"><i className="bg-slate-400" /> Cần lưu ý</span>
      </div>
      <div className="fate-bars">
        {items.map((item, index) => (
          <div key={item.label} className="fate-bar-column">
            {currentIndex === index ? <span className="fate-current-line"><b>Hiện tại</b></span> : null}
            <div className="fate-bar-pair">
              <span className="good" style={{ height: `${item.good}%` }} />
              <span className="challenge" style={{ height: `${item.challenge}%` }} />
            </div>
            <small className={currentIndex === index ? "active" : ""}>{item.label}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendArea({ items, currentIndex, markerLabel }: { items: { label: string; good: number; challenge: number }[]; currentIndex?: number; markerLabel?: string }) {
  const pointsA = items.map((item, index) => `${(index / Math.max(1, items.length - 1)) * 100},${100 - item.good}`).join(" ");
  const pointsB = items.map((item, index) => `${(index / Math.max(1, items.length - 1)) * 100},${100 - item.challenge}`).join(" ");
  const markerX = currentIndex === undefined || currentIndex < 0 ? undefined : (currentIndex / Math.max(1, items.length - 1)) * 100;

  return (
    <div className="fate-area-chart">
      <div className="fate-chart-legend">
        <span className="inline-flex items-center gap-1"><i className="bg-emerald-400" /> Thuận lợi</span>
        <span className="inline-flex items-center gap-1"><i className="bg-slate-400" /> Cần lưu ý</span>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="fortuneA" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.62" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="fortuneB" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#64748b" stopOpacity="0.58" />
            <stop offset="100%" stopColor="#64748b" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <polygon points={`0,100 ${pointsB} 100,100`} fill="url(#fortuneB)" />
        <polyline points={pointsB} fill="none" stroke="#64748b" strokeWidth="1.2" />
        <polygon points={`0,100 ${pointsA} 100,100`} fill="url(#fortuneA)" />
        <polyline points={pointsA} fill="none" stroke="#10b981" strokeWidth="1.3" />
        {markerX !== undefined ? <line x1={markerX} x2={markerX} y1="0" y2="100" stroke="#c2410c" strokeWidth="0.6" /> : null}
      </svg>
      {markerX !== undefined ? <span className="fate-area-marker" style={{ left: `${markerX}%` }}>{markerLabel || "Hiện tại"}</span> : null}
      <div className="fate-area-axis">
        {items.filter((_, index) => index % Math.max(1, Math.ceil(items.length / 10)) === 0).map((item) => <span key={item.label}>{item.label}</span>)}
      </div>
    </div>
  );
}

async function readingMap(user: SessionUser | null, chartId: string, items: FateReadingItem[]) {
  return getCompletedReadingsForScopes(
    user,
    chartId,
    items.map((item) => ({ type: item.type, scopeKey: item.scopeKey })),
  );
}

function fateReadingMapKey(item: FateReadingItem) {
  return `${item.type}:${item.scopeKey}`;
}

function readingHref(nextPath: string, readingId: string, anchor: string) {
  return `${nextPath}${nextPath.includes("?") ? "&" : "?"}reading=${encodeURIComponent(readingId)}#${anchor}-reading`;
}

function ExplainBox({ title = "Biểu đồ của bạn nói gì" }: { title?: string }) {
  return (
    <section className="fate-explain">
      <h2>{title}</h2>
      <p>
        Biểu đồ và preview miễn phí giúp bạn biết hướng chính trước khi mua. Phần mở khóa sẽ giải thích dữ kiện tử vi đã dùng, cơ hội, điểm cần quản trị và các việc nên làm theo đúng cung, năm, tháng hoặc ngày bạn chọn.
      </p>
    </section>
  );
}

function EvidenceList({ item }: { item: FateReadingItem }) {
  return (
    <section className="fate-preview-panel">
      <h3>Dữ kiện miễn phí</h3>
      <div>
        {item.evidence.slice(0, 4).map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </section>
  );
}

function AdviceList({ item }: { item: FateReadingItem }) {
  return (
    <section className="fate-preview-panel warm">
      <h3>Gợi ý nhanh</h3>
      <ul>
        {item.advice.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}

function FateRow({
  chartId,
  item,
  nextPath,
  reading,
  activeReadingId,
}: {
  chartId: string;
  item: FateReadingItem;
  nextPath: string;
  reading: StoredReading | null;
  activeReadingId?: string;
}) {
  const anchor = anchorId(item.scopeKey);
  const isActiveReading = Boolean(reading && reading.id === activeReadingId);
  return (
    <article id={anchor} className="fate-row">
      <div className="fate-row-main">
        <div className="fate-row-head">
          <span className="fate-score-badge">{item.good}</span>
          <div>
            <h2>
              {item.title}
              {item.isCurrent ? <b>Hiện tại</b> : null}
            </h2>
            <div className="fate-row-meta">
              {item.range ? <span>{item.range}</span> : null}
              {item.palace ? <span>Cung {item.palace}</span> : null}
              {item.branch ? <span>{item.branch}</span> : null}
            </div>
          </div>
        </div>
        <p className="fate-summary">{item.summary}</p>
        <div className="fate-preview-grid">
          <EvidenceList item={item} />
          <AdviceList item={item} />
        </div>
      </div>
      <div className="fate-row-action">
        {reading ? (
          <div className="fate-open-action">
            <a className="fate-open-button" href={readingHref(nextPath, reading.id, anchor)}>
              <CheckCircle2 size={16} /> Xem lại nội dung đã mở
            </a>
            <small>Không trừ xu lần nữa.</small>
          </div>
        ) : (
          <OpenButton chartId={chartId} item={item} nextPath={nextPath} />
        )}
      </div>
      {reading && isActiveReading ? (
        <details id={`${anchor}-reading`} className="unlocked-reading" open={isActiveReading}>
          <summary>Nội dung đã mở</summary>
          <MarkdownContent content={reading.content} />
        </details>
      ) : null}
    </article>
  );
}

export async function MajorFateView({ chartId, chart, user, activeReadingId }: FateViewProps) {
  const items = getMajorFateItems(chart);
  const readings = await readingMap(user, chartId, items);
  const currentIndex = items.findIndex((item) => item.isCurrent);

  return (
    <section className="fate-page" data-testid="major-fate-view">
      <FateHero
        title={`Đại vận của ${chart.input.fullName}`}
        description="Nhìn toàn cảnh từng giai đoạn 10 năm trước, rồi chỉ mở đúng đại vận bạn muốn đọc sâu."
        price={formatCoins(FEATURE_PRICES.DAI_VAN.priceCoins)}
      >
        <TrendBars items={items.map((item) => ({ label: item.label, good: item.good, challenge: item.challenge }))} currentIndex={currentIndex === -1 ? undefined : currentIndex} />
      </FateHero>
      <ExplainBox />
      <div className="fate-list">
        {items.map((item) => (
          <FateRow key={item.scopeKey} chartId={chartId} item={item} nextPath={`/la-so/${chartId}?view=dai-van`} reading={readings.get(fateReadingMapKey(item)) || null} activeReadingId={activeReadingId} />
        ))}
      </div>
    </section>
  );
}

export async function MinorFateView({ chartId, chart, user, activeReadingId }: FateViewProps) {
  const items = getMinorFateItems(chart);
  const readings = await readingMap(user, chartId, items);
  const currentIndex = items.findIndex((item) => item.isCurrent);

  return (
    <section className="fate-page" data-testid="minor-fate-view">
      <FateHero
        title={`Tiểu vận của ${chart.input.fullName}`}
        description="So sánh các năm gần nhau để biết năm nào nên tiến, năm nào nên giữ nhịp, rồi mở riêng năm cần quyết định."
        price={formatCoins(FEATURE_PRICES.TIEU_VAN.priceCoins)}
      >
        <TrendArea items={items.map((item) => ({ label: item.label, good: item.good, challenge: item.challenge }))} currentIndex={currentIndex === -1 ? undefined : currentIndex} markerLabel="Năm xem" />
      </FateHero>
      <ExplainBox />
      <div className="fate-list">
        {items.map((item) => (
          <FateRow key={item.scopeKey} chartId={chartId} item={item} nextPath={`/la-so/${chartId}?view=tieu-van`} reading={readings.get(fateReadingMapKey(item)) || null} activeReadingId={activeReadingId} />
        ))}
      </div>
    </section>
  );
}

export async function MonthlyFateView({ chartId, chart, user, activeReadingId }: FateViewProps) {
  const items = getMonthlyFateItems(chart);
  const readings = await readingMap(user, chartId, items);

  return (
    <section className="fate-page narrow" data-testid="monthly-fate-view">
      <FateHero
        title={`Nguyệt vận của ${chart.input.fullName} năm ${chart.input.viewYear}`}
        description="Mỗi tháng có preview miễn phí để bạn nhìn trọng tâm trước, sau đó mở riêng tháng cần đọc kỹ."
        price={formatCoins(FEATURE_PRICES.NGUYET_VAN.priceCoins)}
      />
      <div className="fate-list">
        {items.map((item) => (
          <FateRow key={item.scopeKey} chartId={chartId} item={item} nextPath={`/la-so/${chartId}?view=nguyet-van`} reading={readings.get(fateReadingMapKey(item)) || null} activeReadingId={activeReadingId} />
        ))}
      </div>
    </section>
  );
}

function DailyPlans() {
  const plans = [
    { title: "Xem nhanh", price: formatCoins(FEATURE_PRICES.NHAT_VAN.priceCoins), note: "Mở riêng một ngày đang xem" },
    { title: "Theo tháng", price: formatCoins(FEATURE_PRICES.NGUYET_VAN.priceCoins), note: "Mở từng tháng khi cần đọc kỹ", popular: true },
    { title: "Luận toàn bộ", price: formatCoins(FEATURE_PRICES.FULL.priceCoins), note: "Đọc sâu toàn lá số và vận năm" },
  ];

  return (
    <section className="fate-plans" aria-label="Gói xem ngày và tử vi">
      <h2>Mở khóa trải nghiệm xem ngày & tử vi đầy đủ</h2>
      <p>Truy cập từng phần theo nhu cầu, không cần mua cả báo cáo nếu bạn chỉ muốn xem một ngày hoặc một tháng.</p>
      <div>
        {plans.map((plan) => (
          <article key={plan.title} className={plan.popular ? "fate-plan-card popular" : "fate-plan-card"}>
            {plan.popular ? <span>Phổ biến</span> : null}
            <h3>{plan.title}</h3>
            <strong>{plan.price}</strong>
            <em>{plan.note}</em>
          </article>
        ))}
      </div>
    </section>
  );
}

export async function DailyFateView({ chartId, chart, user, activeReadingId }: FateViewProps) {
  const item = getDailyFateItem(chart);
  const trends = getDailyMonthTrend(chart);
  const readings = await readingMap(user, chartId, [item]);
  const currentIndex = trends.findIndex((trend) => trend.label === String(new Date(item.date).getDate()));
  const reading = readings.get(fateReadingMapKey(item)) || null;

  return (
    <section className="fate-page narrow" data-testid="daily-fate-view">
      <h1>Nhật vận cá nhân hóa</h1>
      <div className="fate-daily-chart">
        <h2><BarChart3 size={19} /> Biểu đồ xu hướng nhật vận tháng của ngày đang xem</h2>
        <TrendArea items={trends} currentIndex={currentIndex === -1 ? undefined : currentIndex} markerLabel={item.label.split("/")[0]} />
      </div>

      <section className="fate-day-card">
        <div>
          <p>{item.range}</p>
          <strong>{item.label.split("/")[0]}</strong>
          <span>{item.title}</span>
        </div>
        <div className="fortune-gauge grid h-36 w-36 place-items-center rounded-full p-3" style={{ background: `conic-gradient(#34d399 ${item.dateScore * 3.6}deg, #bbf7d0 ${item.dateScore * 3.6}deg)` }}>
          <div className="grid h-full w-full place-items-center rounded-full bg-white/95 text-center shadow-inner">
            <strong className="text-4xl font-black text-emerald-600">{item.dateScore}<span className="text-xl">%</span></strong>
          </div>
        </div>
        <div>
          <p className="text-stone-600">Cá nhân hóa theo lá số {chart.input.fullName}</p>
          <span className="tag">Can chi - trực - sao ngày</span>
          <strong>{item.goodHours.slice(0, 2).join(", ")}</strong>
        </div>
      </section>

      <section className="fate-premium-box">
        <h2>{item.title}: tránh rủi ro, chọn việc phù hợp với lá số</h2>
        <p>{item.summary}</p>
        <EvidenceList item={item} />
        <AdviceList item={item} />
        {reading && reading.id === activeReadingId ? (
          <details id={`${anchorId(item.scopeKey)}-reading`} className="unlocked-reading text-left" open={reading.id === activeReadingId}>
            <summary>Nội dung nhật vận đã mở</summary>
            <MarkdownContent content={reading.content} />
          </details>
        ) : reading ? (
          <div className="fate-open-action">
            <a className="fate-open-button" href={readingHref(`/la-so/${chartId}?view=nhat-van`, reading.id, anchorId(item.scopeKey))}>
              <CheckCircle2 size={16} /> Xem lại nội dung đã mở
            </a>
            <small>Không trừ xu lần nữa.</small>
          </div>
        ) : (
          <OpenButton chartId={chartId} item={item} nextPath={`/la-so/${chartId}?view=nhat-van`} />
        )}
      </section>

      <DailyPlans />
    </section>
  );
}
