import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { ChartBoard } from "@/components/chart-board";
import { FeedbackActions } from "@/components/feedback-actions";
import { FullReadingJobPanel } from "@/components/full-reading-job-panel";
import { PaidReadingExperience } from "@/components/paid-reading-experience";
import { ReadingPanel } from "@/components/reading-panel";
import { getDeepReadingSummary } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";
import { getAnyCompletedReading, getCachedReading, getChart, getFeaturePrices, getOperationSettings, getReadingJobById, getReadingJobByScope, getReadingProgress } from "@/lib/data";
import { normalizePaidReading } from "@/lib/paid-reading-presentation";

export const metadata = {
  title: "Luận giải nâng cao",
  robots: { index: false, follow: false },
};

export default async function AdvancedReadingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reading?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const [user, operationSettings, featurePrices] = await Promise.all([getCurrentUser(), getOperationSettings(), getFeaturePrices()]);
  if (!user) redirect(`/dang-nhap?next=/la-so/${id}/nang-cao`);
  if (!operationSettings.paidReadingsEnabled && user.role !== "ADMIN") redirect(`/la-so/${id}`);

  const record = await getChart(id);
  if (!record) notFound();

  if (record.userId && record.userId !== user.id && user.role !== "ADMIN") {
    notFound();
  }

  const requestedReadingCandidate = query.reading ? await getReadingJobById(user.id, query.reading) : null;
  const requestedReading = requestedReadingCandidate?.chartId === id ? requestedReadingCandidate : null;
  const currentFullJob = await getReadingJobByScope(user.id, id, "FULL", "all");
  const fullReading =
    (requestedReading?.status === "COMPLETED" && requestedReading.content ? requestedReading : null) ||
    (await getCachedReading(user.id, id, "FULL", "all")) ||
    (user.role === "ADMIN" ? await getAnyCompletedReading(id, "FULL", "all") : null);
  const pendingReading =
    !fullReading && requestedReading?.type === "FULL" && requestedReading.scopeKey === "all"
      ? requestedReading
      : !fullReading && currentFullJob?.type === "FULL" && currentFullJob.scopeKey === "all"
        ? currentFullJob
        : null;
  if (!fullReading && !pendingReading) redirect(`/la-so/${id}`);

  const summary = getDeepReadingSummary(record.chart);
  const normalizedReading = fullReading ? normalizePaidReading(fullReading.content) : null;
  const savedProgress = fullReading ? await getReadingProgress(user.id, fullReading.id) : null;

  return (
    <main className="chart-page" data-testid="advanced-reading-page">
      <div className="mx-auto max-w-6xl px-3 py-8 sm:px-6 lg:px-8">
        <Link href="/la-so" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-orange-700 hover:text-orange-900">
          <ArrowLeft size={17} /> Quay lại lịch sử lá số
        </Link>

        <section className="rounded-3xl border border-orange-100 bg-white/90 p-5 shadow-2xl shadow-orange-950/10" data-testid="advanced-reading-summary">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">Luận giải nâng cao</p>
              <h1 className="text-3xl font-black text-stone-950">{record.chart.input.fullName}</h1>
              <p className="mt-2 max-w-3xl text-stone-600">
                {pendingReading
                  ? "Bản luận giải đang được tạo theo từng chương. Trang này sẽ tự cập nhật khi hoàn tất."
                  : `Bản phân tích chuyên sâu năm ${record.chart.input.viewYear}, mục tiêu ${summary.wordTarget}, đã lưu để xem lại bất cứ lúc nào.`}
              </p>
            </div>
            <span className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${pendingReading ? "bg-orange-50 text-orange-800" : "bg-emerald-50 text-emerald-700"}`}>
              <Sparkles size={18} /> {pendingReading ? "Đang tạo bản FULL" : "Đã mở nâng cao"}
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {summary.scores.map((score) => (
              <div key={score.key} className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4" data-testid="advanced-reading-score">
                <p className="text-sm font-bold text-stone-600">{score.label}</p>
                <p className="mt-1 text-3xl font-black text-orange-700">{score.value}</p>
                <p className="mt-1 text-xs font-semibold text-stone-500">Chỉ báo định hướng</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/la-so/${id}`} className="btn btn-ghost btn-small">
              Quay lại lá số
            </Link>
            <button className="btn btn-ghost btn-small" type="button" disabled title="Sẽ bổ sung tải PDF ở bước sau">
              Tải PDF sau
            </button>
          </div>
        </section>

        {pendingReading ? (
          <FullReadingJobPanel
            chartId={id}
            readingId={pendingReading.id}
            initialProgress={pendingReading.promptMeta}
            initialStatus={pendingReading.status === "FAILED" || pendingReading.status === "REFUNDED" ? pendingReading.status : "PENDING"}
            initialError={pendingReading.error}
          />
        ) : (
        <>
        <div className="mt-6 chart-frame">
          <div className="min-w-[980px] md:min-w-0">
            <ChartBoard chart={record.chart} />
          </div>
        </div>

        <section
          className="panel reading-content-panel mt-8"
          data-testid="advanced-reading-panel"
          data-ad-view="reading_completed"
          data-reading-id={fullReading!.id}
        >
          <PaidReadingExperience
            readingId={fullReading!.id}
            content={normalizedReading!.content}
            chapters={normalizedReading!.chapters}
            initialProgress={savedProgress ? {
              chapterKey: savedProgress.chapterKey,
              chapterIndex: savedProgress.chapterIndex,
              percent: savedProgress.percent,
              chapterOffset: savedProgress.chapterOffset,
            } : null}
          />
          <FeedbackActions label="luận giải nâng cao" />
        </section>

        <div className="mt-8">
          <ReadingPanel chartId={id} chart={record.chart} featurePrices={featurePrices} />
        </div>
        </>
        )}
      </div>
    </main>
  );
}
