import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { ChartBoard } from "@/components/chart-board";
import { FeedbackActions } from "@/components/feedback-actions";
import { ReadingPanel } from "@/components/reading-panel";
import { getCurrentUser } from "@/lib/auth";
import { getCachedReading, getChart } from "@/lib/data";

export const metadata = {
  title: "Luận giải nâng cao",
  robots: { index: false, follow: false },
};

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

  const fullReading = await getCachedReading(user.id, id, "FULL", "all");
  if (!fullReading) redirect(`/la-so/${id}`);

  return (
    <main className="chart-page">
      <div className="mx-auto max-w-6xl px-3 py-8 sm:px-6 lg:px-8">
        <Link href="/la-so" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-orange-700 hover:text-orange-900">
          <ArrowLeft size={17} /> Quay lại lịch sử lá số
        </Link>

        <section className="rounded-3xl border border-orange-100 bg-white/90 p-5 shadow-2xl shadow-orange-950/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">Luận giải nâng cao</p>
              <h1 className="text-3xl font-black text-stone-950">{record.chart.input.fullName}</h1>
              <p className="mt-2 text-stone-600">Bản phân tích chuyên sâu đã được lưu cho lá số này.</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
              <Sparkles size={18} /> Đã mở nâng cao
            </span>
          </div>
        </section>

        <div className="mt-6 chart-frame">
          <div className="min-w-[980px] md:min-w-0">
            <ChartBoard chart={record.chart} />
          </div>
        </div>

        <section className="panel mt-8">
          <p className="eyebrow">Bản luận giải toàn bộ</p>
          <article className="prose-content whitespace-pre-wrap">{fullReading.content}</article>
          <FeedbackActions label="luận giải nâng cao" />
        </section>

        <div className="mt-8">
          <ReadingPanel chartId={id} chart={record.chart} />
        </div>
      </div>
    </main>
  );
}
