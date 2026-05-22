import { CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import { requestReadingAction } from "@/app/actions";
import { MarkdownContent } from "@/components/markdown-content";
import { getAnyCompletedReading, getCachedReading } from "@/lib/data";
import { formatCoins } from "@/lib/format";
import { getPalaceReadingItems } from "@/lib/palace-analysis";
import { FEATURE_PRICES } from "@/lib/pricing";
import type { SessionUser } from "@/lib/auth";
import type { TuViChart } from "@/lib/chart";

type PalaceFateViewProps = {
  chartId: string;
  chart: TuViChart;
  user: SessionUser | null;
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
  return (
    <form
      action={requestReadingAction}
      data-loading-message="Đang mở luận cung..."
      data-loading-label="Đang mở..."
      className="mt-5"
    >
      <input type="hidden" name="chartId" value={chartId} />
      <input type="hidden" name="type" value="PALACE" />
      <input type="hidden" name="scopeKey" value={palaceName} />
      <input type="hidden" name="next" value={`/la-so/${chartId}?view=luan-cung#${anchorForPalace(palaceName)}`} />
      <button className="btn btn-primary w-full sm:w-auto" type="submit" data-testid={`unlock-palace-${palaceName}`}>
        <LockKeyhole size={18} /> Mở cung này - {formatCoins(FEATURE_PRICES.PALACE.priceCoins)}
      </button>
    </form>
  );
}

export async function PalaceFateView({ chartId, chart, user }: PalaceFateViewProps) {
  const items = getPalaceReadingItems(chart);
  const readingPairs = await Promise.all(
    items.map(async (item) => {
      if (!user) return [item.palace.name, null] as const;
      const reading =
        (await getCachedReading(user.id, chartId, "PALACE", item.palace.name)) ||
        (user.role === "ADMIN" ? await getAnyCompletedReading(chartId, "PALACE", item.palace.name) : null);
      return [item.palace.name, reading] as const;
    }),
  );
  const readings = new Map(readingPairs);
  const unlockedCount = readingPairs.filter(([, reading]) => Boolean(reading)).length;

  return (
    <section className="fate-page" data-testid="palace-fate-view">
      <div className="rounded-3xl border border-orange-100 bg-white/90 p-5 shadow-xl shadow-orange-950/5">
        <p className="eyebrow">Luận cung từng phần</p>
        <div className="mt-2 grid gap-4 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <h1 className="text-3xl font-black text-stone-950">Luận cung lá số {chart.input.fullName}</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
              Mỗi cung có phần xem miễn phí để hiểu nhanh điểm mạnh, điểm cần lưu ý và bằng chứng tử vi. Khi cần đọc sâu, bạn có thể mở riêng từng cung.
            </p>
          </div>
          <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4 text-sm font-bold text-stone-700">
            <p className="flex items-center justify-between gap-3">
              <span>Đã mở khóa</span>
              <strong className="text-xl text-orange-700">{unlockedCount}/12</strong>
            </p>
            <p className="mt-2 flex items-center justify-between gap-3">
              <span>Giá từng cung</span>
              <strong className="text-orange-700">{formatCoins(FEATURE_PRICES.PALACE.priceCoins)}</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {items.map((item) => {
          const reading = readings.get(item.palace.name);
          const anchor = anchorForPalace(item.palace.name);
          return (
            <article key={item.palace.name} id={anchor} className="rounded-3xl border border-orange-100 bg-white/90 p-5 shadow-lg shadow-orange-950/5" data-testid="palace-reading-card">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`grid h-14 w-14 place-items-center rounded-full border text-lg font-black ${scoreTone(item.score)}`}>
                      {item.score}
                    </span>
                    <div>
                      <h2 className="text-2xl font-black text-stone-950">{item.title}</h2>
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

                  <p className="mt-4 text-base leading-7 text-stone-700">{item.summary}</p>

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-sm font-black uppercase tracking-[0.14em] text-orange-800">Dữ kiện tử vi</p>
                      <ul className="mt-3 grid gap-2 text-sm leading-6 text-stone-700">
                        {item.evidence.map((line) => (
                          <li key={line}>- {line}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-2xl bg-orange-50/70 p-4">
                      <p className="text-sm font-black uppercase tracking-[0.14em] text-orange-800">Xem miễn phí</p>
                      <ul className="mt-3 grid gap-2 text-sm leading-6 text-stone-700">
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

                <div className="w-full shrink-0 lg:w-52">
                  {reading ? (
                    <a href={`#${anchor}-reading`} className="btn btn-ghost w-full">
                      Xem lại luận cung
                    </a>
                  ) : (
                    <UnlockPalaceButton chartId={chartId} palaceName={item.palace.name} />
                  )}
                </div>
              </div>

              {reading ? (
                <details id={`${anchor}-reading`} className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4" open>
                  <summary className="cursor-pointer text-base font-black text-emerald-800">Nội dung luận cung đã mở</summary>
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

