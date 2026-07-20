import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { loginModalHref } from "@/components/login-modal-link";
import { MarkdownContent } from "@/components/markdown-content";
import { FreeOverviewRefreshTrigger } from "@/components/free-overview-refresh-trigger";

type FreeOverviewPayload = {
  status: "ready" | "fallback";
  content: string;
  source?: "llm" | "seed-rules";
  jobStatus?: "completed" | "idle" | "processing" | "stale" | "failed";
};

export function FreeOverviewLoader({
  chartId,
  fullName,
  initialOverview,
  isSignedIn = false,
  canReadFullOverview = false,
}: {
  chartId: string;
  fullName: string;
  initialOverview?: FreeOverviewPayload | null;
  isSignedIn?: boolean;
  canReadFullOverview?: boolean;
}) {
  if (!initialOverview?.content) {
    return (
      <div className="free-overview-error" role="status">
        <strong>Chưa tải được luận giải miễn phí.</strong>
        <span>Bạn có thể tải lại trang hoặc xem bàn lá số phía trên.</span>
      </div>
    );
  }

  const chartPath = `/la-so/${chartId}`;
  const nextPath = `${chartPath}#luan-giai`;
  const shouldRefreshOverview =
    initialOverview.source !== "llm" && (initialOverview.jobStatus === "idle" || initialOverview.jobStatus === "stale");

  return (
    <article
      className="free-reading-summary"
      data-ad-view="free_overview_viewed"
      data-ad-depth={canReadFullOverview ? "4" : "2"}
      data-chart-id={chartId}
    >
      {shouldRefreshOverview ? <FreeOverviewRefreshTrigger chartId={chartId} shouldRefresh /> : null}
      <MarkdownContent content={initialOverview.content} />

      {!canReadFullOverview && !isSignedIn ? (
        <section
          className="free-overview-guest-gate"
          aria-labelledby="free-overview-login-title"
          data-ad-view="login_gate_viewed"
          data-chart-id={chartId}
        >
          <div>
            <p className="eyebrow">Bạn đã đọc 2/4 phần miễn phí</p>
            <h2 id="free-overview-login-title">Lưu lá số của {fullName} để đọc tiếp miễn phí</h2>
            <p className="free-overview-login-copy">Email mới tự tạo tài khoản • Tặng 30 xu • Có thể dùng Google • Chưa mất phí</p>
          </div>
          <div className="free-overview-locked-sections" aria-label="Hai phần mở sau đăng nhập">
            <div className="free-overview-locked-row">
              <LockKeyhole size={16} aria-hidden="true" />
              <strong>Quan hệ và nhịp sống</strong>
            </div>
            <div className="free-overview-locked-row">
              <LockKeyhole size={16} aria-hidden="true" />
              <strong>Vận hiện tại</strong>
            </div>
          </div>
          <Link
            className="btn btn-primary"
            href={loginModalHref(chartPath, undefined, nextPath)}
            scroll={false}
            data-ad-click="login_gate_clicked"
            data-chart-id={chartId}
          >
            Lưu lá số &amp; đọc tiếp miễn phí
          </Link>
        </section>
      ) : !canReadFullOverview ? (
        <section className="free-overview-guest-gate" aria-labelledby="free-overview-access-title" role="status">
          <div>
            <p className="eyebrow">Quyền riêng tư của lá số</p>
            <h2 id="free-overview-access-title">Lá số này không thuộc tài khoản của bạn</h2>
            <p className="free-overview-login-copy">
              Bạn vẫn có thể đọc 2 phần tổng quan được chia sẻ. Hãy lập lá số của riêng bạn để lưu và mở nội dung cá nhân hóa.
            </p>
          </div>
          <Link className="btn btn-primary" href="/lap-la-so">
            Lập lá số của bạn
          </Link>
        </section>
      ) : null}
    </article>
  );
}
