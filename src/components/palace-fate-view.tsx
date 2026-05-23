import { CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import { requestReadingAction } from "@/app/actions";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { MarkdownContent } from "@/components/markdown-content";
import { getCompletedReadingsForScopes } from "@/lib/data";
import { formatCoins } from "@/lib/format";
import { getPalaceReadingItems } from "@/lib/palace-analysis";
import { FEATURE_PRICES } from "@/lib/pricing";
import type { SessionUser } from "@/lib/auth";
import type { TuViChart } from "@/lib/chart";

type PalaceFateViewProps = {
  chartId: string;
  chart: TuViChart;
  user: SessionUser | null;
  activeReadingId?: string;
};

function anchorForPalace(name: string) {
  return `cung-${name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

function scoreTone(score: number) {
  if (score >= 68) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (score >= 48) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

function UnlockPalaceButton({ chartId, palaceName }: { chartId: string; palaceName: string }) {
  const anchor = anchorForPalace(palaceName);
  return (
    <form
      action={requestReadingAction}
      data-loading-message="Đang mở luận cung..."
      data-loading-label="Đang mở..."
      className="unlock-palace-action mt-5"
    >
      <input type="hidden" name="chartId" value={chartId} />
      <input type="hidden" name="type" value="PALACE" />
      <input type="hidden" name="scopeKey" value={palaceName} />
      <input type="hidden" name="next" value={`/la-so/${chartId}?view=luan-cung#${anchor}-reading`} />
      <LoadingSubmitButton className="btn btn-primary w-full sm:w-auto" loadingText="Đang mở..." data-testid={`unlock-palace-${palaceName}`}>
        <LockKeyhole size={18} /> Đọc luận chi tiết - {formatCoins(FEATURE_PRICES.PALACE.priceCoins)}
      </LoadingSubmitButton>
      <p className="unlock-microcopy">Mở một lần, lưu lại để xem lại khi cần.</p>
    </form>
  );
}

function palaceReadingHref(chartId: string, readingId: string, anchor: string) {
  return `/la-so/${chartId}?view=luan-cung&reading=${encodeURIComponent(readingId)}#${anchor}-reading`;
}

export async function PalaceFateView({ chartId, chart, user, activeReadingId }: PalaceFateViewProps) {
  const items = getPalaceReadingItems(chart);
  const completedReadings = await getCompletedReadingsForScopes(
    user,
    chartId,
    items.map((item) => ({ type: "PALACE", scopeKey: item.palace.name })),
  );
  const unlockedCount = completedReadings.size;

  return (
    <section className="fate-page" data-testid="palace-fate-view">
      <header className="fate-hero palace">
        <div className="fate-hero-copy">
          <h1>Luận cung lá số {chart.input.fullName}</h1>
          <p>Mỗi cung có preview miễn phí để hiểu nhanh điểm mạnh, điểm cần lưu ý và bằng chứng tử vi. Khi cần đọc sâu, bạn mở riêng đúng cung mình quan tâm.</p>
          <div className="fate-hero-points" aria-label="Trạng thái luận cung">
            <span><CheckCircle2 size={15} /> Đã mở {unlockedCount}/12 cung</span>
            <span><LockKeyhole size={15} /> Giá từng cung {formatCoins(FEATURE_PRICES.PALACE.priceCoins)}</span>
            <span><Sparkles size={15} /> Nên đọc Mệnh, Quan Lộc, Tài Bạch trước</span>
          </div>
        </div>
        <div className="fate-hero-visual palace-stat-card">
          <strong>{unlockedCount}</strong>
          <span>/12 cung đã mở</span>
          <p>Mở từng phần, lưu lại để đọc lại khi cần.</p>
        </div>
      </header>

      <div className="mt-6 grid gap-4">
        {items.map((item) => {
          const reading = completedReadings.get(`PALACE:${item.palace.name}`);
          const anchor = anchorForPalace(item.palace.name);
          const isActiveReading = Boolean(reading && reading.id === activeReadingId);
          return (
            <article key={item.palace.name} id={anchor} className="palace-reading-card" data-testid="palace-reading-card">
              <div className="palace-card-grid">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`grid h-12 w-12 place-items-center rounded-full border text-base font-black ${scoreTone(item.score)}`}>
                      {item.score}
                    </span>
                    <div>
                      <h2 className="text-xl font-black text-stone-950">{item.title}</h2>
                      <p className="mt-1 text-sm font-bold text-stone-500">
                        {item.level} · {item.palace.branch} · {item.palace.lifecycle}
                      </p>
                    </div>
                    {reading ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">
                        <CheckCircle2 size={17} /> Đã mở khóa
                      </span>
                    ) : null}
                  </div>

                  <p className="palace-card-summary">{item.summary}</p>

                  <div className="palace-preview-grid">
                    <div className="palace-preview-panel">
                      <p>Dữ kiện tử vi</p>
                      <ul>
                        {item.evidence.map((line) => (
                          <li key={line}>- {line}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="palace-preview-panel warm">
                      <p>Xem miễn phí</p>
                      <ul>
                        {item.strengths.slice(0, 2).map((line) => (
                          <li key={line} className="flex gap-2">
                            <Sparkles className="mt-1 shrink-0 text-orange-500" size={15} /> {line}
                          </li>
                        ))}
                        {item.cautions.slice(0, 1).map((line) => (
                          <li key={line} className="flex gap-2">
                            <LockKeyhole className="mt-1 shrink-0 text-stone-500" size={15} /> {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="palace-unlock-panel">
                  {reading ? (
                    <a href={palaceReadingHref(chartId, reading.id, anchor)} className="btn btn-ghost w-full">
                      Xem lại nội dung đã mở
                    </a>
                  ) : (
                    <UnlockPalaceButton chartId={chartId} palaceName={item.palace.name} />
                  )}
                </div>
              </div>

              {reading && isActiveReading ? (
                <details id={`${anchor}-reading`} className="unlocked-reading" open={isActiveReading}>
                  <summary>Nội dung luận cung đã mở</summary>
                  <MarkdownContent content={reading.content} />
                </details>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="fate-pager fate-next-actions">
        <span>‹</span>
        <a href={`/la-so/${chartId}?view=dai-van`}>Xem đại vận ›</a>
      </div>
    </section>
  );
}
