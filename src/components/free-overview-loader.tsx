import Link from "next/link";
import { loginModalHref } from "@/components/login-modal-link";
import { MarkdownContent } from "@/components/markdown-content";

type FreeOverviewPayload = {
  status: "ready";
  content: string;
};

export function FreeOverviewLoader({
  chartId,
  initialOverview,
  isSignedIn = false,
}: {
  chartId: string;
  initialOverview?: FreeOverviewPayload | null;
  isSignedIn?: boolean;
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

  return (
    <article
      className="free-reading-summary"
      data-ad-view="free_insights_viewed"
      data-ad-depth={isSignedIn ? "4" : "2"}
      data-chart-id={chartId}
    >
      <MarkdownContent content={initialOverview.content} />

      {!isSignedIn ? (
        <section
          className="free-overview-guest-gate"
          aria-labelledby="free-overview-login-title"
          data-ad-view="login_gate_viewed"
          data-chart-id={chartId}
        >
          <div>
            <p className="eyebrow">Bạn đã đọc 2/4 phần miễn phí</p>
            <h2 id="free-overview-login-title">Lưu lá số để đọc tiếp 2 phần còn lại</h2>
            <p className="free-overview-login-copy">Email mới sẽ tự tạo tài khoản và nhận 30 xu.</p>
          </div>
          <div className="free-overview-locked-sections" aria-label="Hai phần mở sau đăng nhập">
            <div className="free-overview-locked-row">
              <span aria-hidden="true">🔒</span>
              <strong>Quan hệ và nhịp sống</strong>
            </div>
            <div className="free-overview-locked-row">
              <span aria-hidden="true">🔒</span>
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
            Đăng nhập hoặc tạo tài khoản
          </Link>
        </section>
      ) : null}
    </article>
  );
}
