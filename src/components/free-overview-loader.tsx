"use client";

import { useEffect, useState } from "react";

type FreeOverviewState =
  | { status: "loading"; content?: undefined; error?: undefined }
  | { status: "ready"; content: string; error?: undefined }
  | { status: "error"; content?: undefined; error: string };

export function FreeOverviewLoader({ chartId }: { chartId: string }) {
  const [state, setState] = useState<FreeOverviewState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    async function loadOverview() {
      try {
        const response = await fetch(`/api/charts/${encodeURIComponent(chartId)}/free-overview`, {
          method: "GET",
          signal: controller.signal,
          headers: { accept: "application/json" },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || "Không tải được luận giải.");
        setState({ status: "ready", content: String(payload.content || "") });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          error: error instanceof Error ? error.message : "Không tải được luận giải.",
        });
      }
    }

    loadOverview();
    return () => controller.abort();
  }, [chartId]);

  if (state.status === "ready") {
    return <article className="prose-content free-reading-summary whitespace-pre-wrap">{state.content}</article>;
  }

  if (state.status === "error") {
    return (
      <div className="free-overview-error" role="status">
        <strong>Chưa tải được luận giải miễn phí.</strong>
        <span>{state.error} Bạn có thể tải lại trang hoặc xem trước bàn lá số bên trên.</span>
      </div>
    );
  }

  return (
    <div className="free-overview-loading" role="status" aria-live="polite">
      <div>
        <strong>Đang chuẩn bị luận giải miễn phí...</strong>
        <span>Lá số đã hiển thị trước để bạn xem ngay. Phần luận giải đang được viết ở nền.</span>
      </div>
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}
