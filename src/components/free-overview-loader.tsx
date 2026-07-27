import Link from "next/link";
import { loginModalHref } from "@/components/login-modal-link";
import { FreeOverviewReadingExperience } from "@/components/free-overview-reading-experience";
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
  canCheckoutFull,
  priceCoins = 199,
}: {
  chartId: string;
  fullName: string;
  initialOverview?: FreeOverviewPayload | null;
  isSignedIn?: boolean;
  canReadFullOverview?: boolean;
  canCheckoutFull: boolean;
  priceCoins?: number;
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
  const isLlmReady = initialOverview.source === "llm";
  const shouldAttemptLlm = !isLlmReady && initialOverview.jobStatus !== "failed";
  const hasPremiumHookPreview = initialOverview.content.includes("🔒 Nâng cấp Premium để xem:");

  return (
    <article
      className="free-reading-summary"
      data-ad-view="free_overview_viewed"
      data-ad-depth={canReadFullOverview || hasPremiumHookPreview ? "4" : "2"}
      data-chart-id={chartId}
    >
      <FreeOverviewReadingExperience
        content={initialOverview.content}
        fullName={fullName}
        chartId={chartId}
        canCheckoutFull={canCheckoutFull}
        isSignedIn={isSignedIn}
        priceCoins={priceCoins}
      />

      {shouldAttemptLlm ? (
        <section className="free-overview-personalizing" role="status" aria-live="polite" data-ad-view="free_overview_loading" data-chart-id={chartId}>
          <FreeOverviewRefreshTrigger chartId={chartId} shouldRefresh />
          <div>
            <strong>AI đang cá nhân hóa phần phân tích chi tiết...</strong>
            <span>Ba kết luận chính đã sẵn sàng. Nội dung từng phần sẽ tự cập nhật mà không làm bạn mất vị trí đang đọc.</span>
          </div>
          <div className="free-overview-personalizing-dots" aria-hidden="true"><i /><i /><i /></div>
        </section>
      ) : null}

      {!canReadFullOverview && !isSignedIn && !canCheckoutFull ? (
        <section
          className="free-overview-guest-gate"
          aria-labelledby="free-overview-login-title"
          data-ad-view="login_gate_viewed"
          data-chart-id={chartId}
        >
          <div>
            <p className="eyebrow">Bạn đã đọc đủ 4 phần miễn phí</p>
            <h2 id="free-overview-login-title">Đăng nhập để lưu lá số của {fullName}</h2>
            <p className="free-overview-login-copy">Email mới tự tạo tài khoản • Tặng 30 xu • Có thể dùng Google • Chưa mất phí</p>
          </div>
          <Link
            className="btn btn-primary"
            href={loginModalHref(chartPath, undefined, nextPath)}
            scroll={false}
            data-ad-click="login_gate_clicked"
            data-chart-id={chartId}
          >
            Đăng nhập để lưu lá số
          </Link>
        </section>
      ) : !canReadFullOverview && !canCheckoutFull ? (
        <section className="free-overview-guest-gate" aria-labelledby="free-overview-access-title" role="status">
          <div>
            <p className="eyebrow">Quyền riêng tư của lá số</p>
            <h2 id="free-overview-access-title">Lá số này không thuộc tài khoản của bạn</h2>
            <p className="free-overview-login-copy">
              Bạn vẫn có thể đọc phần tổng quan miễn phí được chia sẻ. Hãy lập lá số của riêng bạn để lưu và mở nội dung cá nhân hóa.
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
