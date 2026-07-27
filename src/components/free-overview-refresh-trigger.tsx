"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const FREE_OVERVIEW_BLOCK_LABELS: Record<string, string> = {
  intro: "phần mở đầu",
  section_1: "năng lực thiên phú",
  section_2: "phong cách kiếm tiền",
  section_3: "môi trường làm việc",
  section_4: "vận hạn năm",
};

type FreeOverviewPollPayload = {
  status?: "ready" | "fallback";
  source?: "llm" | "seed-rules";
  jobStatus?: "completed" | "idle" | "processing" | "stale" | "failed";
  completedBlocks?: number;
  totalBlocks?: number;
  nextBlockKey?: string;
};

export function FreeOverviewRefreshTrigger({ chartId, shouldRefresh }: { chartId: string; shouldRefresh: boolean }) {
  const router = useRouter();
  const [statusText, setStatusText] = useState("Đang gọi AI để viết bản luận giải hay hơn...");

  useEffect(() => {
    if (!shouldRefresh) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const postedBlocks = new Set<string>();

    async function startBlock(blockKey: string) {
      if (postedBlocks.has(blockKey)) return;
      postedBlocks.add(blockKey);
      try {
        const response = await fetch(`/api/charts/${encodeURIComponent(chartId)}/free-overview/process?block=${encodeURIComponent(blockKey)}`, {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!response.ok) throw new Error("free overview block queue failed");
      } catch {
        postedBlocks.delete(blockKey);
        if (!cancelled) setStatusText("Chưa gọi được hàng đợi AI, hệ thống đang kiểm tra lại...");
      }
    }

    async function pollUntilReady(attempt = 0) {
      if (cancelled) return;
      if (attempt >= 45) {
        setStatusText("AI đang mất nhiều thời gian hơn bình thường. Bản đọc nhanh vẫn dùng được, hệ thống sẽ thử lại khi bạn tải lại trang.");
        return;
      }

      try {
        const response = await fetch(`/api/charts/${encodeURIComponent(chartId)}/free-overview`, {
          cache: "no-store",
          credentials: "same-origin",
        });
        const payload = await response.json().catch(() => null) as FreeOverviewPollPayload | null;

        if (payload?.status === "ready" && payload?.source === "llm") {
          setStatusText("Đã có đủ bản AI, đang cập nhật nội dung...");
          router.refresh();
          return;
        }

        const completed = payload?.completedBlocks ?? 0;
        const total = payload?.totalBlocks ?? 5;
        const nextBlock = payload?.nextBlockKey || "intro";
        if ((payload?.jobStatus === "failed" || payload?.jobStatus === "stale") && nextBlock) postedBlocks.delete(nextBlock);
        const label = FREE_OVERVIEW_BLOCK_LABELS[nextBlock] || "phần tiếp theo";
        setStatusText(completed > 0
          ? `AI đã viết ${completed}/${total} phần, đang viết tiếp ${label}...`
          : `AI đang viết ${label} trước để phần đầu hay hơn...`);

        if (nextBlock && payload?.jobStatus !== "processing") {
          await startBlock(nextBlock);
        }

        if (completed > 0 && attempt % 2 === 1) router.refresh();
      } catch {
        if (!cancelled) setStatusText("Đường truyền AI đang chậm. Bản đọc nhanh vẫn hiển thị bình thường...");
      }

      timeoutId = setTimeout(() => {
        void pollUntilReady(attempt + 1);
      }, 2000);
    }

    void startBlock("intro");
    void pollUntilReady();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [chartId, router, shouldRefresh]);

  return (
    <span className="free-overview-ai-status">
      {statusText}
      <span className="free-overview-writing-cursor" aria-hidden="true" />
    </span>
  );
}
