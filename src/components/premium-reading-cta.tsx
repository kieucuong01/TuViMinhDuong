import { Sparkles, X } from "lucide-react";
import { checkoutFullReadingAction, requestReadingAction } from "@/app/actions";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { premiumReadingModalId } from "@/components/premium-reading-target";

type PremiumReadingCtaProps = {
  chartId: string;
  fullName: string;
  hasAdvancedReading: boolean;
  fullPriceCoins: number;
  coinBalance: number;
  requiresCheckoutEmail: boolean;
};

function cashLabel(priceCoins: number) {
  return `${new Intl.NumberFormat("vi-VN").format(priceCoins * 1000)}đ`;
}

export function PremiumReadingCta({
  chartId,
  fullName,
  hasAdvancedReading,
  fullPriceCoins,
  coinBalance,
  requiresCheckoutEmail,
}: PremiumReadingCtaProps) {
  if (hasAdvancedReading) return null;
  const modalId = premiumReadingModalId(chartId);
  const hasEnoughCoins = coinBalance >= fullPriceCoins;

  return (
    <section
      id={modalId}
      className="premium-confirm-modal premium-confirm-popover"
      aria-labelledby="premium-confirm-title"
      popover="auto"
      data-testid="premium-reading-confirm-modal"
    >
      <button type="button" className="premium-confirm-close" aria-label="Đóng" popoverTarget={modalId} popoverTargetAction="hide">
        <X size={18} />
      </button>
      <span className="premium-confirm-icon" aria-hidden="true"><Sparkles size={26} /></span>
      <p className="eyebrow">Bản FULL 9 chương cá nhân hóa</p>
      <h2 id="premium-confirm-title">{requiresCheckoutEmail ? "Nhập email để thanh toán" : "Chọn cách thanh toán"}</h2>
      <p>Lá số của <strong>{fullName}</strong> sẽ được lưu để bạn đọc lại không mất thêm phí.</p>

      <div className="premium-confirm-price">
        <span>Giá trọn gói</span>
        <strong>{cashLabel(fullPriceCoins)} ({fullPriceCoins} xu)</strong>
      </div>

      <form
        action={checkoutFullReadingAction}
        className="premium-confirm-actions"
        data-ad-event="begin_checkout"
        data-ad-method="payos"
        data-chart-id={chartId}
        data-ad-placement="full_offer_modal"
        data-loading-message="Đang mở PayOS..."
      >
        <input type="hidden" name="chartId" value={chartId} />
        {requiresCheckoutEmail ? (
          <label className="premium-confirm-email">
            <span>Email đối soát giao dịch</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="ban@email.com"
              required
              autoFocus
            />
            <small>Dùng để đối soát và hỗ trợ khôi phục giao dịch.</small>
          </label>
        ) : null}
        <LoadingSubmitButton className="btn btn-primary" loadingText="Đang mở PayOS..." data-testid="premium-reading-confirm-submit" autoFocus={!requiresCheckoutEmail}>
          Thanh toán PayOS — {cashLabel(fullPriceCoins)}
        </LoadingSubmitButton>
      </form>

      {!requiresCheckoutEmail && hasEnoughCoins ? (
        <form
          action={requestReadingAction}
          className="premium-confirm-actions premium-confirm-coin-action"
          data-ad-event="begin_checkout"
          data-ad-method="coins"
          data-chart-id={chartId}
          data-ad-placement="full_offer_modal_coins"
          data-loading-message="Đang dùng xu..."
        >
          <input type="hidden" name="chartId" value={chartId} />
          <input type="hidden" name="type" value="FULL" />
          <input type="hidden" name="scopeKey" value="all" />
          <input type="hidden" name="next" value={`/la-so/${chartId}`} />
          <LoadingSubmitButton className="btn btn-ghost" loadingText="Đang dùng xu...">
            Dùng {fullPriceCoins} xu hiện có
          </LoadingSubmitButton>
        </form>
      ) : null}
    </section>
  );
}
