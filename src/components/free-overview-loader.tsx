"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { loginModalHref } from "@/components/login-modal-link";
import { MarkdownContent } from "@/components/markdown-content";
import { premiumReadingModalId } from "@/components/premium-reading-target";

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
const GUEST_LOCKED_SECTIONS = [
  "Khí chất và nội lực",
  "Công việc và tài chính",
  "Tình cảm và quan hệ",
  "Vận năm và cẩm nang hành động",
];

function hideFreeOverviewTemplateHeading(content: string) {
  return content
    .split(/\r?\n/)
    .filter((line) => !/^#{1,6}\s*Tổng quan miễn phí\s*$/i.test(line.trim()))
    .join("\n")
    .trimStart();
}

function initialOverviewState(
  initialOverview?: FreeOverviewPayload | null,
): FreeOverviewState {
  if (!initialOverview) return { status: "loading" };
  if (initialOverview.status === "ready") {
    return {
      status: "ready",
      content: initialOverview.content,
      detailContent: initialOverview.content,
    };
  }
  return {
    status: "fallback",
    content: "",
    jobStatus: initialOverview.jobStatus || "idle",
    error: initialOverview.error,
  };
}

export function FreeOverviewLoader({
  chartId,
  initialOverview,
  isSignedIn = false,
}: {
  chartId: string;
  initialOverview?: FreeOverviewPayload | null;
  isSignedIn?: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<FreeOverviewState>(() => initialOverviewState(initialOverview));
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
          setState({
            status: "ready",
            content: String(payload.content || ""),
            detailContent: String(payload.content || ""),
          });
          router.refresh();
          return;
        }

        setState({
          status: "fallback",
          content: "",
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
  }, [chartId, router, runKey]);

  if (state.status === "fallback") {
    const canRetry = state.jobStatus === "stale" || state.jobStatus === "failed";
    return (
      <div ref={setRootNode} className="free-overview-loading" role="status" aria-live="polite">
        <div className="free-overview-inline-status">
          <strong>
            {state.jobStatus === "failed"
              ? "Chưa viết xong mini-report bằng LLM."
              : state.jobStatus === "stale"
                ? "Tiến trình viết mini-report trước đó quá lâu chưa xong."
                : "Đang viết mini-report cá nhân hóa bằng LLM."}
          </strong>
          <span>
            {state.jobStatus === "failed"
              ? "Bản dự phòng không còn được hiển thị. Bạn có thể thử viết lại để nhận đúng bản cá nhân hóa."
              : "Hệ thống đang dùng dữ liệu lá số để viết bản luận giải miễn phí. Bạn có thể xem bàn lá số phía trên trong lúc chờ."}
          </span>
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
        </div>
      </div>
    );
  }

  if (state.status === "ready") {
    const expandedOverviewContent = hideFreeOverviewTemplateHeading(state.detailContent);

    if (!isSignedIn) {
      const chartPath = `/la-so/${chartId}`;
      const nextPath = `${chartPath}#luan-giai`;

      return (
        <article ref={setRootNode} className="free-reading-summary">
          <MarkdownContent content={expandedOverviewContent} />
          <section className="free-overview-guest-gate" aria-labelledby="free-overview-login-title">
            <div>
              <p className="eyebrow">Bản đọc đầy đủ đang chờ bạn</p>
              <h2 id="free-overview-login-title">Mở tiếp mini-report khoảng 1.200 từ</h2>
              <p className="free-overview-login-copy">
                Lá số này sẽ được giữ nguyên. Sau đăng nhập, bạn quay lại đúng vị trí và đọc tiếp toàn bộ luận giải miễn phí.
              </p>
            </div>
            <div className="free-overview-locked-sections" aria-label="Các nội dung mở sau đăng nhập">
              {GUEST_LOCKED_SECTIONS.map((label) => (
                <div className="free-overview-locked-row" key={label}>
                  <span aria-hidden="true">🔒</span>
                  <strong>{label}</strong>
                </div>
              ))}
            </div>
            <Link
              className="btn btn-primary"
              href={loginModalHref(chartPath, undefined, nextPath)}
              scroll={false}
            >
              Đăng nhập miễn phí để xem toàn bộ luận giải
            </Link>
          </section>
        </article>
      );
    }

    return (
      <article ref={setRootNode} className="free-reading-summary">
        <section className="free-overview-detail-block" aria-labelledby="free-overview-detail-title">
          <div className="free-overview-detail-heading">
            <div>
              <p className="eyebrow">Mini-report miễn phí</p>
              <h2 id="free-overview-detail-title">Hồ sơ cá nhân từ dữ liệu lá số</h2>
            </div>
          </div>
          <MarkdownContent content={expandedOverviewContent} />
        </section>
        <section className="free-overview-vip-transition" aria-label="Luận giải chuyên sâu">
          <div>
            <strong>Bạn đã xem các trục chính của lá số.</strong>
            <p>Hồ sơ VIP mở rộng sang 12 cung, đại vận và các mốc thời gian thành một kế hoạch chi tiết hơn.</p>
          </div>
          <button
            type="button"
            className="btn btn-small btn-primary"
            popoverTarget={premiumReadingModalId(chartId)}
          >
            Xem hồ sơ luận giải chuyên sâu
          </button>
        </section>
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
        <strong>Đang chuẩn bị mini-report cá nhân...</strong>
        <span>Lá số đã hiển thị trước để bạn xem ngay. Hồ sơ miễn phí đang được viết từ dữ liệu lá số.</span>
      </div>
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}
