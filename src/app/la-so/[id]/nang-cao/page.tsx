import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react";
import { ChartBoard } from "@/components/chart-board";
import { FeedbackActions } from "@/components/feedback-actions";
import { MarkdownContent } from "@/components/markdown-content";
import { ReadingPanel } from "@/components/reading-panel";
import { getDeepReadingSummary, paidReadingChapters } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";
import { getAnyCompletedReading, getCachedReading, getChart } from "@/lib/data";

export const metadata = {
  title: "Luận giải nâng cao",
  robots: { index: false, follow: false },
};

function headingId(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default async function AdvancedReadingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/dang-nhap?next=/la-so/${id}/nang-cao`);

  const record = await getChart(id);
  if (!record) notFound();

  if (record.userId && record.userId !== user.id && user.role !== "ADMIN") {
    notFound();
  }

  const fullReading =
    (await getCachedReading(user.id, id, "FULL", "all")) ||
    (user.role === "ADMIN" ? await getAnyCompletedReading(id, "FULL", "all") : null);
  if (!fullReading) redirect(`/la-so/${id}`);

  const summary = getDeepReadingSummary(record.chart);
  const chapters = paidReadingChapters(record.chart, "FULL");

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
                Bản phân tích chuyên sâu năm {record.chart.input.viewYear}, mục tiêu {summary.wordTarget}, đã lưu để xem lại bất cứ lúc nào.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
              <Sparkles size={18} /> Đã mở nâng cao
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

        <div className="mt-6 chart-frame">
          <div className="min-w-[980px] md:min-w-0">
            <ChartBoard chart={record.chart} />
          </div>
        </div>

        <section className="panel mt-8" data-testid="advanced-reading-panel">
          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[260px_1fr] lg:items-start">
            <aside className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4 lg:sticky lg:top-24" data-testid="advanced-reading-toc">
              <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-orange-800">
                <BookOpen size={17} /> Mục lục
              </p>
              <nav className="mt-3 grid gap-2 text-sm font-bold text-stone-700" aria-label="Mục lục luận giải nâng cao">
                {chapters.map((chapter) => (
                  <a key={chapter.key} href={`#${headingId(chapter.title)}`} className="rounded-xl px-3 py-2 hover:bg-white hover:text-orange-800">
                    {chapter.title}
                  </a>
                ))}
              </nav>
            </aside>

            <article data-testid="advanced-reading-chapter-list">
              <p className="eyebrow">Bản luận giải toàn bộ</p>
              <MarkdownContent content={fullReading.content} />
            </article>
          </div>
          <FeedbackActions label="luận giải nâng cao" />
        </section>

        <div className="mt-8">
          <ReadingPanel chartId={id} chart={record.chart} />
        </div>
      </div>
    </main>
  );
}
