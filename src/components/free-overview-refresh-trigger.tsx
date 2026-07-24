"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function FreeOverviewRefreshTrigger({ chartId, shouldRefresh }: { chartId: string; shouldRefresh: boolean }) {
  const router = useRouter();
  const [statusText, setStatusText] = useState("Đang gọi AI để viết bản luận giải hay hơn...");

  useEffect(() => {
    if (!shouldRefresh) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function pollUntilReady(attempt = 0) {
      if (cancelled) return;
      if (attempt >= 30) {
        setStatusText("AI đang mất nhiều thời gian hơn bình thường. Bản đọc nhanh vẫn dùng được, hệ thống sẽ thử lại khi bạn tải lại trang.");
        return;
      }
      setStatusText(attempt < 2 ? "Đang gọi AI..." : "AI đang luận giải từ dữ liệu lá số của bạn...");

      try {
        const response = await fetch(`/api/charts/${encodeURIComponent(chartId)}/free-overview`, {
          cache: "no-store",
          credentials: "same-origin",
        });
        const payload = await response.json().catch(() => null);
        if (
          (payload?.status === "ready" && payload?.source === "llm") ||
          payload?.jobStatus === "failed" ||
          payload?.jobStatus === "stale"
        ) {
          setStatusText(payload?.source === "llm" ? "Đã có bản AI, đang cập nhật nội dung..." : "AI chưa trả được bản hợp lệ, đang giữ bản đọc nhanh.");
          router.refresh();
          return;
        }
      } catch {
        return;
      }

      timeoutId = setTimeout(() => {
        void pollUntilReady(attempt + 1);
      }, 2000);
    }

    void fetch(`/api/charts/${encodeURIComponent(chartId)}/free-overview/process`, {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
    }).catch(() => {
      if (!cancelled) setStatusText("Chưa gọi được hàng đợi AI, hệ thống đang kiểm tra lại...");
    });
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
