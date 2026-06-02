"use client";

import { useEffect, useState } from "react";
import { MarkdownContent } from "@/components/markdown-content";

type FreeOverviewState =
  | { status: "loading"; content?: undefined; error?: undefined }
  | { status: "ready"; content: string; error?: undefined }
  | { status: "fallback"; content: string; jobStatus: "idle" | "processing" | "stale" | "failed"; error?: string }
  | { status: "error"; content?: string; error: string };

type FreeOverviewPayload =
  | {
      status: "ready";
      content: string;
    }
  | {
      status: "fallback";
      content: string;
      jobStatus?: "idle" | "processing" | "stale" | "failed";
      error?: string;
    };

const POLL_DELAY_MS = 2500;
const MAX_POLL_ATTEMPTS = 24;

function initialOverviewState(initialOverview?: FreeOverviewPayload | null): FreeOverviewState {
  if (!initialOverview?.content) return { status: "loading" };
  if (initialOverview.status === "ready") return { status: "ready", content: initialOverview.content };
  return {
    status: "fallback",
    content: initialOverview.content,
    jobStatus: initialOverview.jobStatus || "idle",
    error: initialOverview.error,
  };
}

export function FreeOverviewLoader({ chartId, initialOverview }: { chartId: string; initialOverview?: FreeOverviewPayload | null }) {
  const [state, setState] = useState<FreeOverviewState>(() => initialOverviewState(initialOverview));

  useEffect(() => {
    const controller = new AbortController();
    let processStarted = false;
    let pollAttempts = 0;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;

    function clearPollTimer() {
      if (!pollTimer) return;
      clearTimeout(pollTimer);
      pollTimer = undefined;
    }

    function schedulePoll() {
      if (controller.signal.aborted || pollAttempts >= MAX_POLL_ATTEMPTS) return;
      pollAttempts += 1;
      clearPollTimer();
      pollTimer = setTimeout(loadOverview, POLL_DELAY_MS);
    }

    async function startProcess() {
      if (processStarted || controller.signal.aborted) return;
      processStarted = true;

      try {
        const response = await fetch(`/api/charts/${encodeURIComponent(chartId)}/free-overview/process`, {
          method: "POST",
          signal: controller.signal,
          headers: { accept: "application/json" },
        });
        if (response.status === 404) return;
        schedulePoll();
      } catch {
        if (!controller.signal.aborted) schedulePoll();
      }
    }

    async function loadOverview() {
      try {
        const response = await fetch(`/api/charts/${encodeURIComponent(chartId)}/free-overview`, {
          method: "GET",
          signal: controller.signal,
          headers: { accept: "application/json" },
        });
        const payload = (await response.json()) as FreeOverviewPayload & { error?: string };
        if (!response.ok) throw new Error(payload?.error || "Không tải được luận giải.");

        if (payload.status === "ready") {
          clearPollTimer();
          setState({ status: "ready", content: String(payload.content || "") });
          return;
        }

        setState({
          status: "fallback",
          content: String(payload.content || ""),
          jobStatus: payload.jobStatus || "idle",
          error: payload.error,
        });
        startProcess();
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          error: error instanceof Error ? error.message : "Không tải được luận giải.",
        });
      }
    }

    loadOverview();
    return () => {
      controller.abort();
      clearPollTimer();
    };
  }, [chartId]);

  if (state.status === "ready" || state.status === "fallback") {
    return (
      <article className="free-reading-summary">
        {state.status === "fallback" ? (
          <div className="free-overview-inline-status" role="status" aria-live="polite">
            {state.jobStatus === "failed"
              ? "Đang hiển thị bản tóm tắt nhanh. Bản chi tiết sẽ được thử lại khi bạn mở lại trang."
              : "Đang viết bản chi tiết hơn ở nền. Bạn có thể đọc bản tóm tắt này trước."}
          </div>
        ) : null}
        <MarkdownContent content={state.content} />
      </article>
    );
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
