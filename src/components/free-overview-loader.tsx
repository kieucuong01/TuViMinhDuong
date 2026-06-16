"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MarkdownContent } from "@/components/markdown-content";

type FreeOverviewState =
  | { status: "loading"; content?: string; error?: undefined }
  | { status: "ready"; content: string; detailContent: string; error?: undefined }
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
const MAX_POLL_ATTEMPTS = 72;

function initialOverviewState(
  initialOverview?: FreeOverviewPayload | null,
  instantOverviewContent?: string | null,
): FreeOverviewState {
  if (!initialOverview?.content) {
    return instantOverviewContent
      ? { status: "fallback", content: instantOverviewContent, jobStatus: "idle" }
      : { status: "loading" };
  }
  if (initialOverview.status === "ready") {
    return {
      status: "ready",
      content: instantOverviewContent || initialOverview.content,
      detailContent: initialOverview.content,
    };
  }
  return {
    status: "fallback",
    content: initialOverview.content,
    jobStatus: initialOverview.jobStatus || "idle",
    error: initialOverview.error,
  };
}

export function FreeOverviewLoader({
  chartId,
  initialOverview,
  instantOverviewContent,
  isSignedIn = false,
}: {
  chartId: string;
  initialOverview?: FreeOverviewPayload | null;
  instantOverviewContent?: string | null;
  isSignedIn?: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<FreeOverviewState>(() => initialOverviewState(initialOverview, instantOverviewContent));
  const [runKey, setRunKey] = useState(0);
  const rootRef = useRef<HTMLElement | null>(null);
  const setRootNode = (node: HTMLElement | null) => {
    rootRef.current = node;
  };

  function retryOverview() {
    setState((current) =>
      current.status === "fallback"
        ? { ...current, jobStatus: "processing" as const, error: undefined }
        : { status: "loading" },
    );
    setRunKey((value) => value + 1);
  }

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
          cache: "no-store",
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
          cache: "no-store",
          signal: controller.signal,
          headers: { accept: "application/json" },
        });
        const payload = (await response.json()) as FreeOverviewPayload & { error?: string };
        if (!response.ok) throw new Error(payload?.error || "Không tải được luận giải.");

        if (payload.status === "ready") {
          clearPollTimer();
          setState((current) => ({
            status: "ready",
            content:
              current.status === "fallback" || current.status === "ready"
                ? current.content
                : instantOverviewContent || String(payload.content || ""),
            detailContent: String(payload.content || ""),
          }));
          router.refresh();
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
  }, [chartId, instantOverviewContent, router, runKey]);

  if (state.status === "ready" || state.status === "fallback") {
    const canRetry = state.status === "fallback" && (state.jobStatus === "stale" || state.jobStatus === "failed");
    const loginHref = `/dang-nhap?next=${encodeURIComponent(`/la-so/${chartId}`)}`;
    const detailHref = isSignedIn ? `/la-so/${chartId}/nang-cao` : loginHref;
    const detailCta = isSignedIn ? "Xem luận giải chi tiết" : "Đăng nhập để xem chi tiết";
    const hasExpandedOverview = state.status === "ready" && state.detailContent !== state.content;
    return (
      <article ref={setRootNode} className="free-reading-summary">
        {!hasExpandedOverview ? <MarkdownContent content={state.content} /> : null}
        {state.status === "fallback" ? (
          <div className="free-overview-inline-status" role="status" aria-live="polite">
            {state.jobStatus === "failed"
              ? "Đang hiển thị bản tổng quan nhanh. Bản chi tiết hơn bị gián đoạn và có thể thử viết lại."
              : state.jobStatus === "stale"
                ? "Đang hiển thị bản tổng quan nhanh. Job nền trước đó quá lâu chưa xong, bạn có thể thử viết lại."
                : state.jobStatus === "processing"
                  ? "Đang viết bản chi tiết hơn ở nền. Bạn có thể đọc bản tổng quan này trước."
                  : "Bản tổng quan nhanh đã sẵn sàng. Hệ thống đang chuẩn bị bản chi tiết hơn ở nền."}
            {canRetry ? (
              <button type="button" className="btn btn-small btn-ghost" onClick={retryOverview}>
                Thử viết lại
              </button>
            ) : null}
            {state.jobStatus === "processing" || state.jobStatus === "idle" ? (
              <span className="free-overview-detail-loader" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            ) : null}
            <Link className="btn btn-small btn-primary" href={detailHref}>
              {detailCta}
            </Link>
          </div>
        ) : null}
        {hasExpandedOverview ? (
          <section className="free-overview-detail-block" aria-labelledby="free-overview-detail-title">
            <div className="free-overview-detail-heading">
              <div>
                <p className="eyebrow">Bản chi tiết hơn</p>
                <h2 id="free-overview-detail-title">Luận giải tổng quan mở rộng</h2>
              </div>
              <Link className="btn btn-small btn-primary" href={detailHref}>
                {detailCta}
              </Link>
            </div>
            <MarkdownContent content={state.detailContent} />
          </section>
        ) : null}
      </article>
    );
  }

  if (state.status === "error") {
    return (
      <div ref={setRootNode} className="free-overview-error" role="status">
        <strong>Chưa tải được luận giải miễn phí.</strong>
        <span>{state.error} Bạn có thể tải lại trang hoặc xem trước bàn lá số bên trên.</span>
        <button type="button" className="btn btn-small btn-ghost" onClick={retryOverview}>
          Thử viết lại
        </button>
      </div>
    );
  }

  return (
    <div ref={setRootNode} className="free-overview-loading" role="status" aria-live="polite">
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
