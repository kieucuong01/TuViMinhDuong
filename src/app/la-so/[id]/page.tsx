import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChartBoard, MobileChartReader } from "@/components/chart-board";
import { requestReadingAction } from "@/app/actions";
import { getCachedReading, getChart, getReadingById } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { FEATURE_PRICES, TEMPORARY_FULL_ACCESS } from "@/lib/pricing";
import { formatCoins } from "@/lib/format";
import { FeedbackActions } from "@/components/feedback-actions";
import { PromptChips } from "@/components/prompt-chips";
import { ReadingTabs } from "@/components/reading-tabs";
import { DeferredAssistantWidget } from "@/components/deferred-assistant-widget";
import { ChartQuickInsights } from "@/components/chart-quick-insights";
import { FateTabs, type FateView } from "@/components/fate-tabs";
import { DailyFateView, MajorFateView, MinorFateView, MonthlyFateView, PalaceFateView } from "@/components/fate-views";

export const metadata: Metadata = {
  title: "Lá số tử vi",
  robots: { index: false, follow: false },
};

const readingLabels = {
  FULL: "Luận giải toàn bộ",
  PALACE: "Luận cung",
  DAI_VAN: "Đại vận",
  NGUYET_VAN: "Nguyệt vận",
  NHAT_VAN: "Nhật vận",
} as const;

export default async function ChartPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reading?: string; view?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const record = await getChart(id);
  if (!record) notFound();
  const fateViews: FateView[] = ["la-so", "luan-cung", "dai-van", "tieu-van", "nguyet-van", "nhat-van", "chuyen-de"];
  const activeView: FateView = fateViews.includes(query.view as FateView) ? (query.view as FateView) : "la-so";

  const user = await getCurrentUser();
  const selectedReading = user && query.reading ? await getReadingById(user.id, query.reading) : null;
  const fullReading = user ? await getCachedReading(user.id, id, "FULL", "all") : null;
  const activeReading = selectedReading || fullReading;
  const activeLabel = activeReading ? readingLabels[activeReading.type] : "Luận giải tổng quan";

  return (
    <main className="chart-page">
      <FateTabs chartId={id} active={activeView} />

      <div className="mx-auto max-w-6xl px-3 pb-10 sm:px-6 lg:px-8">
        {activeView === "dai-van" ? <MajorFateView chartId={id} chart={record.chart} /> : null}
        {activeView === "luan-cung" ? <PalaceFateView chartId={id} chart={record.chart} /> : null}
        {activeView === "tieu-van" ? <MinorFateView chartId={id} chart={record.chart} /> : null}
        {activeView === "nguyet-van" ? <MonthlyFateView chartId={id} chart={record.chart} /> : null}
        {activeView === "nhat-van" ? <DailyFateView chartId={id} chart={record.chart} /> : null}
        {["luan-cung", "dai-van", "tieu-van", "nguyet-van", "nhat-van"].includes(activeView) ? null : (
        <>
        <div className="chart-titlebar">
          <h1>Tổng quan lá số của {record.chart.input.fullName}</h1>
          <form action={requestReadingAction}>
            <input type="hidden" name="chartId" value={id} />
            <input type="hidden" name="type" value="FULL" />
            <input type="hidden" name="scopeKey" value="all" />
            <input type="hidden" name="next" value={`/la-so/${id}`} />
            <button className="chart-reading-button" type="submit">
              {TEMPORARY_FULL_ACCESS ? "Luận giải toàn bộ miễn phí" : `Luận giải toàn bộ - ${formatCoins(FEATURE_PRICES.FULL.priceCoins)}`}
            </button>
          </form>
        </div>

        {TEMPORARY_FULL_ACCESS ? (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            Đang mở full chức năng trong giai đoạn thử nghiệm: xem luận giải không cần đăng nhập, nạp xu hay mở khóa.
          </div>
        ) : null}

        <ChartQuickInsights chart={record.chart} chartId={id} />

        <MobileChartReader chart={record.chart} />

        <div className="chart-frame hidden md:block">
          <div className="min-w-[980px] md:min-w-0">
            <ChartBoard chart={record.chart} />
          </div>
        </div>

        <PromptChips chartId={id} chart={record.chart} />

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="panel">
            <p className="eyebrow">{activeLabel}</p>
            {activeReading ? (
              <>
                <article className="prose-content whitespace-pre-wrap">{activeReading.content}</article>
                <FeedbackActions label={activeLabel.toLowerCase()} />
              </>
            ) : (
              <div className="space-y-4 text-stone-700">
                {record.chart.summary.map((item) => (
                  <p key={item}>{item}</p>
                ))}
                <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
                  <p className="font-semibold text-stone-800">
                    {TEMPORARY_FULL_ACCESS
                      ? "Bấm xem toàn bộ để hệ thống sinh bản luận giải AI đầy đủ cho lá số này."
                      : "Đọc miễn phí phần tóm tắt. Mở khóa bản toàn bộ để xem phân tích 12 cung, vận hạn và gợi ý hành động."}
                  </p>
                  <form action={requestReadingAction} className="mt-4">
                    <input type="hidden" name="chartId" value={id} />
                    <input type="hidden" name="type" value="FULL" />
                    <input type="hidden" name="scopeKey" value="all" />
                    <input type="hidden" name="next" value={`/la-so/${id}`} />
                    <button className="btn btn-primary" type="submit">
                      {TEMPORARY_FULL_ACCESS ? "Xem toàn bộ miễn phí" : `Mở khóa toàn bộ - ${formatCoins(FEATURE_PRICES.FULL.priceCoins)}`}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </section>
          <aside className="panel">
            <p className="eyebrow">Thông tin nhanh</p>
            <dl className="info-list">
              <div><dt>Âm lịch</dt><dd>{record.chart.lunar.day}/{record.chart.lunar.month}/{record.chart.lunar.year}</dd></div>
              <div><dt>Can chi năm</dt><dd>{record.chart.canChi.year}</dd></div>
              <div><dt>Mệnh</dt><dd>{record.chart.menh}</dd></div>
              <div><dt>Thân</dt><dd>{record.chart.than}</dd></div>
              <div><dt>Cục</dt><dd>{record.chart.cuc}</dd></div>
            </dl>
          </aside>
        </div>

        <ReadingTabs chartId={id} chart={record.chart} />
        </>
        )}
      </div>
      <DeferredAssistantWidget chartId={id} />
    </main>
  );
}
