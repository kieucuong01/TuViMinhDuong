import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChartBoard, MobileChartReader } from "@/components/chart-board";
import { getAnyCompletedReading, getCachedReading, getChart, getReadingById } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { FeedbackActions } from "@/components/feedback-actions";
import { PromptChips } from "@/components/prompt-chips";
import { ReadingTabs } from "@/components/reading-tabs";
import { DeferredAssistantWidget } from "@/components/deferred-assistant-widget";
import { ChartQuickInsights } from "@/components/chart-quick-insights";
import { FateTabs, type FateView } from "@/components/fate-tabs";
import { DailyFateView, MajorFateView, MinorFateView, MonthlyFateView, PalaceFateView } from "@/components/fate-views";
import { PremiumReadingCta } from "@/components/premium-reading-cta";
import { ChartActionPanel } from "@/components/chart-action-panel";
import { PaywallPopup } from "@/components/paywall-popup";
import { FreeOverviewLoader } from "@/components/free-overview-loader";

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
  const fullReading = user
    ? (await getCachedReading(user.id, id, "FULL", "all")) ||
      (user.role === "ADMIN" ? await getAnyCompletedReading(id, "FULL", "all") : null)
    : null;
  const activeReading = selectedReading || fullReading;
  const hasAdvancedReading = Boolean(fullReading);
  const activeLabel = activeReading ? readingLabels[activeReading.type] : "Luận giải tổng quan";

  return (
    <main className="chart-page" data-testid="chart-page">
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
        </div>

        <ChartQuickInsights chart={record.chart} chartId={id} />

        <MobileChartReader chart={record.chart} />

        <div className="chart-frame hidden md:block">
          <div className="min-w-[980px] md:min-w-0">
            <ChartBoard chart={record.chart} />
          </div>
        </div>

        <ChartActionPanel chartId={id} chart={record.chart} />

        <PromptChips chartId={id} chart={record.chart} />

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="panel" id="luan-giai" data-testid="free-reading-panel">
            <p className="eyebrow">{activeLabel}</p>
            {activeReading ? (
              <>
                <article className="prose-content whitespace-pre-wrap">{activeReading.content}</article>
                <FeedbackActions label={activeLabel.toLowerCase()} />
              </>
            ) : (
              <>
                <FreeOverviewLoader chartId={id} />
              </>
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
        <PremiumReadingCta chartId={id} fullName={record.chart.input.fullName} hasAdvancedReading={hasAdvancedReading} />
        </>
        )}
      </div>
      <Suspense fallback={null}>
        <PaywallPopup />
      </Suspense>
      <DeferredAssistantWidget chartId={id} />
    </main>
  );
}
