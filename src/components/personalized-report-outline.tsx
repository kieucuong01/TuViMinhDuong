import Link from "next/link";
import { CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import { loginModalHref } from "@/components/login-modal-link";
import { premiumReadingModalId } from "@/components/premium-reading-target";
import type { ReportOutlineItem } from "@/lib/chart-evidence";

function cashLabel(priceCoins: number) {
  return `${new Intl.NumberFormat("vi-VN").format(priceCoins * 1000)}đ`;
}

function renderOutlineItems(items: ReportOutlineItem[], offset: number, unlocked: boolean) {
  return items.map((item, index) => (
    <li className="report-outline-item" key={item.key}>
      <span className="report-outline-number">{String(index + offset + 1).padStart(2, "0")}</span>
      <div>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
      </div>
      {unlocked ? (
        <CheckCircle2 className="report-outline-state is-open" size={20} aria-label="Đã mở" />
      ) : (
        <LockKeyhole className="report-outline-state" size={18} aria-label="Đang khóa" />
      )}
    </li>
  ));
}

export function PersonalizedReportOutline({
  chartId,
  items,
  unlocked,
  priceCoins,
  isSignedIn,
  canReadFullOverview,
}: {
  chartId: string;
  items: ReportOutlineItem[];
  unlocked: boolean;
  priceCoins: number;
  isSignedIn: boolean;
  canReadFullOverview: boolean;
}) {
  const chartPath = `/la-so/${chartId}`;
  const previewItems = items.slice(0, 3);
  const remainingItems = items.slice(3);

  return (
    <section
      id="personal-report-outline"
      className={`personal-report-outline ${unlocked ? "is-unlocked" : "is-locked"}`}
      aria-labelledby="personal-report-outline-title"
      data-chart-id={chartId}
      {...(!unlocked ? { "data-ad-view": "full_offer_viewed" } : {})}
    >
      <div className="personal-report-outline-heading">
        <div>
          <p className="eyebrow">
            {unlocked
              ? "Bản FULL đã mở"
              : !isSignedIn
                ? "Xem trước giá trị bản FULL"
                : canReadFullOverview
                  ? "Một lựa chọn duy nhất để đọc sâu"
                  : "Bản FULL được bảo vệ"}
          </p>
          <h2 id="personal-report-outline-title">Bản FULL 9 chương cá nhân hóa</h2>
          <p>Luận giải nối trực tiếp bốn insight miễn phí với các cung, sao, đại vận và vận năm trong chính lá số này.</p>
        </div>
        <span className="personal-report-outline-badge">
          <Sparkles size={16} aria-hidden="true" />
          {items.length} chương
        </span>
      </div>

      <ol className="personal-report-outline-list">{renderOutlineItems(previewItems, 0, unlocked)}</ol>
      {remainingItems.length ? (
        <details className="personal-report-outline-details" open={!isSignedIn || unlocked}>
          <summary>Xem {remainingItems.length} chương còn lại</summary>
          <ol className="personal-report-outline-list" start={4}>
            {renderOutlineItems(remainingItems, 3, unlocked)}
          </ol>
        </details>
      ) : null}

      {unlocked ? (
        <Link className="btn btn-primary personal-report-outline-cta" href={`/la-so/${chartId}/nang-cao`}>
          Đọc lại bản FULL
        </Link>
      ) : (
        <div className="personal-report-outline-offer">
          <ul>
            <li>Đọc lại không mất thêm phí</li>
            <li>Tặng 3 câu hỏi với Cố vấn AI</li>
            <li><strong>{cashLabel(priceCoins)} ({priceCoins} xu)</strong></li>
          </ul>
          {!isSignedIn ? (
            <Link
              className="btn btn-primary personal-report-outline-cta"
              href={loginModalHref(chartPath, undefined, `${chartPath}#personal-report-outline`)}
              scroll={false}
              data-ad-click="login_gate_clicked"
              data-chart-id={chartId}
              data-testid="premium-reading-cta-bottom"
            >
              Lưu lá số &amp; đọc tiếp miễn phí
            </Link>
          ) : canReadFullOverview ? (
            <button
              type="button"
              className="btn btn-primary personal-report-outline-cta"
              popoverTarget={premiumReadingModalId(chartId)}
              data-ad-click="full_offer_clicked"
              data-chart-id={chartId}
              data-testid="premium-reading-cta-bottom"
            >
              Mở bản FULL 9 chương — {cashLabel(priceCoins)}
            </button>
          ) : (
            <div role="status">
              <strong>Lá số này không thuộc tài khoản của bạn</strong>
              <span>Hãy lập lá số của riêng bạn để mở nội dung cá nhân hóa.</span>
              <Link className="btn btn-primary personal-report-outline-cta" href="/lap-la-so" data-testid="premium-reading-cta-bottom">
                Lập lá số của bạn
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
