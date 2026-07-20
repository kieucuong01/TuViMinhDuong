import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChartBoard, MobileChartReader } from "@/components/chart-board";
import { getAnyCompletedReading, getCachedReading, getChart, getFeaturePrices, getFreeOverviewStatus, getOperationSettings, getReadingById, getUserBalance } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { FeedbackActions } from "@/components/feedback-actions";
import { PromptChips } from "@/components/prompt-chips";
import { ReadingTabs } from "@/components/reading-tabs";
import { DeferredAssistantWidget } from "@/components/deferred-assistant-widget";
import { FateTabs, type FateView } from "@/components/fate-tabs";
import { DailyFateView, MajorFateView, MinorFateView, MonthlyFateView } from "@/components/fate-views";
import { PalaceFateView } from "@/components/palace-fate-view";
import { PremiumReadingCta } from "@/components/premium-reading-cta";
import { DeferredChartActionPanel } from "@/components/deferred-chart-action-panel";
import { ChartRetentionPanel } from "@/components/chart-retention-panel";
import { PaywallPopup } from "@/components/paywall-popup";
import { FreeOverviewLoader } from "@/components/free-overview-loader";
import { ReadingHashScrollRestorer } from "@/components/reading-detail-cta";
import { MarkdownContent } from "@/components/markdown-content";
import { buildFreeOverviewTeaser, countVisibleMarkdownWords } from "@/lib/free-overview-presentation";
import { PersonalizedReportOutline } from "@/components/personalized-report-outline";
import { buildPersonalizedReportOutline } from "@/lib/chart-evidence";
import { listAssistantQuestions } from "@/lib/chart-assistant-store";
import type { AssistantAccess } from "@/components/assistant-widget";

export const metadata: Metadata = {
  title: "Lá số tử vi",
  robots: { index: false, follow: false },
};

const readingLabels = {
  FULL: "Luận giải toàn bộ",
  PALACE: "Luận cung",
  DAI_VAN: "Đại vận",
  TIEU_VAN: "Tiểu vận",
  NGUYET_VAN: "Nguyệt vận",
  NHAT_VAN: "Nhật vận",
} as const;

function checkoutNotice(checkout?: string, status?: string) {
  if (status === "cancelled") return "Thanh toán đã được hủy. Lá số của bạn vẫn được giữ nguyên và bạn có thể thử lại khi sẵn sàng.";
  if (checkout === "pending") return "PayOS chưa xác nhận giao dịch. Hệ thống chưa mở bản FULL và không trừ xu của bạn.";
  if (checkout === "disabled") return "Thanh toán bản FULL hiện đang tạm dừng. Bạn có thể quay lại lá số và thử lại sau.";
  if (checkout) return "Chưa thể mở thanh toán cho lá số này. Không có khoản xu nào bị trừ; bạn có thể tải lại trang rồi thử lại.";
  return "";
}

export default async function ChartPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reading?: string; view?: string; checkout?: string; status?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const record = await getChart(id);
  if (!record) notFound();
  const [user, operationSettings] = await Promise.all([getCurrentUser(), getOperationSettings()]);
  const canReadFullOverview = Boolean(user && (user.role === "ADMIN" || record.userId === user.id));
  const paidFeaturesVisible = operationSettings.paidReadingsEnabled || user?.role === "ADMIN";
  const canUsePaidFateViews = paidFeaturesVisible && canReadFullOverview;
  const featurePrices = paidFeaturesVisible ? await getFeaturePrices() : null;
  const fateViews: FateView[] = canUsePaidFateViews ? ["la-so", "luan-cung", "dai-van", "tieu-van", "nguyet-van", "nhat-van"] : ["la-so"];
  const activeView: FateView = fateViews.includes(query.view as FateView) ? (query.view as FateView) : "la-so";
  const isScopedReadingView = ["luan-cung", "dai-van", "tieu-van", "nguyet-van", "nhat-van"].includes(activeView);

  const selectedReadingCandidate = canReadFullOverview && user && query.reading && !isScopedReadingView
    ? await getReadingById(user.id, query.reading)
    : null;
  const selectedReading = selectedReadingCandidate?.chartId === id ? selectedReadingCandidate : null;
  const fullReading = canReadFullOverview && user && !isScopedReadingView
    ? (await getCachedReading(user.id, id, "FULL", "all")) ||
      (user.role === "ADMIN" ? await getAnyCompletedReading(id, "FULL", "all") : null)
    : null;
  const activeReading = selectedReading || fullReading;
  const hasAdvancedReading = Boolean(fullReading);
  const assistantFullReading = canReadFullOverview && user
    ? fullReading ||
      (await getCachedReading(user.id, id, "FULL", "all")) ||
      (user.role === "ADMIN" ? await getAnyCompletedReading(id, "FULL", "all") : null)
    : null;
  const assistantHistory = user && assistantFullReading ? await listAssistantQuestions(user.id, id) : [];
  const assistantRemaining = Math.max(0, 3 - assistantHistory.length);
  const assistantAccess: AssistantAccess = !user
    ? { status: "login-required", remaining: 0, history: [] }
    : !assistantFullReading
      ? { status: "full-required", remaining: 0, history: [] }
      : {
          status: assistantRemaining > 0 ? "ready" : "exhausted",
          remaining: assistantRemaining,
          history: assistantHistory,
        };
  const reportOutline = buildPersonalizedReportOutline(record.chart);
  const paymentNotice = checkoutNotice(query.checkout, query.status);
  const coinBalance = canReadFullOverview && user ? await getUserBalance(user) : 0;
  const activeLabel = activeReading ? readingLabels[activeReading.type] : "Luận giải tổng quan";
  const freeOverviewStatus = activeReading || isScopedReadingView ? null : getFreeOverviewStatus(record.chart);
  const restrictedOverviewContent = !canReadFullOverview && freeOverviewStatus?.status === "ready"
    ? buildFreeOverviewTeaser(freeOverviewStatus.content)
    : null;
  const visibleFreeOverviewStatus = !canReadFullOverview && freeOverviewStatus
    ? { ...freeOverviewStatus, content: restrictedOverviewContent || "", wordCount: countVisibleMarkdownWords(restrictedOverviewContent || "") }
    : freeOverviewStatus;

  return (
    <main className="chart-page" data-testid="chart-page">
      <ReadingHashScrollRestorer />
      {canUsePaidFateViews ? <FateTabs chartId={id} active={activeView} /> : null}

      <div className="mx-auto max-w-6xl px-3 pb-10 sm:px-6 lg:px-8">
        {activeView === "dai-van" && featurePrices ? <MajorFateView chartId={id} chart={record.chart} user={user} activeReadingId={query.reading} featurePrices={featurePrices} /> : null}
        {activeView === "luan-cung" && featurePrices ? <PalaceFateView chartId={id} chart={record.chart} user={user} activeReadingId={query.reading} featurePrices={featurePrices} /> : null}
        {activeView === "tieu-van" && featurePrices ? <MinorFateView chartId={id} chart={record.chart} user={user} activeReadingId={query.reading} featurePrices={featurePrices} /> : null}
        {activeView === "nguyet-van" && featurePrices ? <MonthlyFateView chartId={id} chart={record.chart} user={user} activeReadingId={query.reading} featurePrices={featurePrices} /> : null}
        {activeView === "nhat-van" && featurePrices ? <DailyFateView chartId={id} chart={record.chart} user={user} activeReadingId={query.reading} featurePrices={featurePrices} /> : null}
        {isScopedReadingView ? null : (
        <>
        <div className="chart-titlebar">
          <h1>Tổng quan lá số của {record.chart.input.fullName}</h1>
        </div>
        {paymentNotice ? <p className="chart-checkout-notice" role="status">{paymentNotice}</p> : null}

        <ChartRetentionPanel
          chartId={id}
          chart={record.chart}
          isSignedIn={Boolean(user)}
          canUsePaidFateViews={canUsePaidFateViews}
        />

        <MobileChartReader chart={record.chart} />

        <div className="chart-frame hidden md:block">
          <div className="min-w-[980px] md:min-w-0">
            <ChartBoard chart={record.chart} />
          </div>
        </div>

        <DeferredChartActionPanel chartId={id} chart={record.chart} />

        <div className="chart-quick-panels">
          {canUsePaidFateViews ? (
            <PromptChips
              chartId={id}
              chart={record.chart}
              className="rounded-2xl border border-orange-100 bg-white/85 p-4 shadow-sm backdrop-blur"
            />
          ) : null}
          <aside className="panel chart-quick-info">
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

        <section className="panel reading-content-panel mt-8" id="luan-giai" data-testid="free-reading-panel">
          <p className="eyebrow">{activeLabel}</p>
          {activeReading ? (
            <>
              <MarkdownContent content={activeReading.content} />
              <FeedbackActions label={activeLabel.toLowerCase()} />
            </>
          ) : (
            <>
              <FreeOverviewLoader
                chartId={id}
                fullName={record.chart.input.fullName}
                initialOverview={visibleFreeOverviewStatus}
                isSignedIn={Boolean(user)}
                canReadFullOverview={canReadFullOverview}
              />
            </>
          )}
        </section>

        {paidFeaturesVisible ? (
          <>
            <PersonalizedReportOutline
              chartId={id}
              items={reportOutline}
              unlocked={hasAdvancedReading}
              priceCoins={featurePrices?.FULL.priceCoins ?? 199}
              isSignedIn={Boolean(user)}
              canReadFullOverview={canReadFullOverview}
            />
            {canReadFullOverview && featurePrices ? <ReadingTabs chartId={id} chart={record.chart} featurePrices={featurePrices} /> : null}
            {canReadFullOverview && featurePrices ? <PremiumReadingCta chartId={id} fullName={record.chart.input.fullName} hasAdvancedReading={hasAdvancedReading} fullPriceCoins={featurePrices.FULL.priceCoins} coinBalance={coinBalance} /> : null}
          </>
        ) : null}
        </>
        )}
      </div>
      <Suspense fallback={null}>
        <PaywallPopup />
      </Suspense>
      <DeferredAssistantWidget chartId={id} initialAccess={assistantAccess} />
    </main>
  );
}
