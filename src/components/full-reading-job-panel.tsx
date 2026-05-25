"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, Sparkles } from "lucide-react";

type ChapterProgress = {
  key: string;
  title: string;
  model?: string;
  wordCount?: number;
  formatGuarded?: boolean;
};

type ReadingProgress = {
  completed: number;
  total: number;
  chapters: ChapterProgress[];
};

type FullReadingJobPanelProps = {
  chartId: string;
  readingId: string;
  initialProgress?: unknown;
  initialStatus?: "PENDING" | "FAILED" | "REFUNDED";
  initialError?: string | null;
};

function extractProgress(value: unknown): ReadingProgress {
  const fallback = { completed: 0, total: 8, chapters: [] };
  if (!value || typeof value !== "object") return fallback;
  const record = value as { progress?: unknown };
  const progress = record.progress;
  if (!progress || typeof progress !== "object") return fallback;
  const progressRecord = progress as { completed?: unknown; total?: unknown; chapters?: unknown };
  return {
    completed: typeof progressRecord.completed === "number" ? progressRecord.completed : fallback.completed,
    total: typeof progressRecord.total === "number" && progressRecord.total > 0 ? progressRecord.total : fallback.total,
    chapters: Array.isArray(progressRecord.chapters) ? (progressRecord.chapters as ChapterProgress[]) : [],
  };
}

export function FullReadingJobPanel({ chartId, readingId, initialProgress, initialStatus = "PENDING", initialError }: FullReadingJobPanelProps) {
  const router = useRouter();
  const startedRef = useRef(false);
  const [status, setStatus] = useState<"pending" | "failed">(initialStatus === "FAILED" || initialStatus === "REFUNDED" ? "failed" : "pending");
  const [error, setError] = useState(initialError || "");
  const [progress, setProgress] = useState(() => extractProgress(initialProgress));
  const percent = useMemo(() => Math.round((progress.completed / Math.max(1, progress.total)) * 100), [progress.completed, progress.total]);

  useEffect(() => {
    if (status !== "pending" || startedRef.current) return;
    startedRef.current = true;
    fetch(`/api/readings/${readingId}/process`, { method: "POST", cache: "no-store" })
      .then(async (response) => {
        if (response.ok || response.status === 202) return;
        const data = await response.json().catch(() => null);
        setStatus("failed");
        setError(data?.error || "Không khởi động được job luận giải.");
      })
      .catch(() => {
        setStatus("failed");
        setError("Kết nối bị gián đoạn khi khởi động job luận giải.");
      });
  }, [readingId, status]);

  useEffect(() => {
    if (status !== "pending") return;
    let active = true;

    const poll = async () => {
      try {
        const response = await fetch(`/api/readings?chartId=${chartId}&type=FULL&scopeKey=all`, { cache: "no-store" });
        if (!active || !response.ok) return;
        const data = await response.json();
        if (data.status === "ready") {
          router.replace(`/la-so/${chartId}/nang-cao?reading=${readingId}`);
          router.refresh();
          return;
        }
        if (data.status === "failed") {
          setStatus("failed");
          setError(data.error || "Không tạo được luận giải. Nếu đã trừ xu, hệ thống sẽ hoàn lại.");
          setProgress(extractProgress(data.progress));
          return;
        }
        if (data.status === "pending") setProgress(extractProgress(data.progress));
      } catch {
        // Polling will try again on the next tick.
      }
    };

    void poll();
    const interval = window.setInterval(poll, 3000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [chartId, readingId, router, status]);

  if (status === "failed") {
    return (
      <section className="panel mt-8" data-testid="full-reading-job-failed">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
            <AlertCircle size={24} />
          </span>
          <div>
            <p className="eyebrow">Chưa tạo được luận giải</p>
            <h2 className="mt-2 text-2xl font-black text-stone-950">Job luận giải bị gián đoạn</h2>
            <p className="mt-2 max-w-2xl text-stone-600">
              {error || "Hệ thống đã ghi nhận lỗi. Nếu tài khoản đã bị trừ xu, hệ thống sẽ hoàn lại trong cùng giao dịch xử lý."}
            </p>
            <Link href={`/la-so/${chartId}`} className="btn btn-primary btn-small mt-4">
              Quay lại lá số
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel mt-8 overflow-hidden" data-testid="full-reading-job-pending">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow">Đang tạo luận giải</p>
          <h2 className="mt-2 text-3xl font-black text-stone-950">Đang viết bản luận giải toàn bộ</h2>
          <p className="mt-3 text-stone-600">
            Hệ thống đang xử lý từng chương và lưu ngay khi xong. Bạn có thể giữ trang này mở, kết quả sẽ tự hiện khi hoàn tất.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-black text-orange-800">
          <LoaderCircle className="animate-spin" size={18} />
          {progress.completed}/{progress.total} chương
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-sm font-bold text-stone-600">
          <span>Tiến độ</span>
          <span>{percent}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-orange-100">
          <div className="h-full rounded-full bg-gradient-to-r from-orange-600 to-emerald-500 transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {progress.chapters.length > 0 ? (
          progress.chapters.map((chapter) => (
            <div key={chapter.key} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={19} />
                <div>
                  <p className="font-black text-stone-900">{chapter.title}</p>
                  <p className="mt-1 text-sm text-stone-600">
                    Đã lưu {chapter.wordCount ? `${chapter.wordCount} từ` : "nội dung chương"}
                    {chapter.formatGuarded ? " bằng bản fallback riêng chương." : "."}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4 text-sm font-semibold text-stone-600">
            <Sparkles size={18} className="mb-2 text-orange-700" />
            Đang chuẩn bị dữ liệu lá số và chia chương để xử lý song song.
          </div>
        )}
      </div>
    </section>
  );
}
