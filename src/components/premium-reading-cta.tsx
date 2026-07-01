"use client";

import Link from "next/link";
import { LockKeyhole, Sparkles, X } from "lucide-react";
import { requestReadingAction } from "@/app/actions";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { premiumReadingModalId } from "@/components/premium-reading-target";
import { formatCoins } from "@/lib/format";

type PremiumReadingCtaProps = {
  chartId: string;
  fullName: string;
  hasAdvancedReading: boolean;
  fullPriceCoins: number;
};

function PremiumCtaContent({ hasAdvancedReading, fullPriceCoins }: { hasAdvancedReading: boolean; fullPriceCoins: number }) {
  return (
    <>
      <span className="premium-reading-cta-orb" aria-hidden="true">
        {hasAdvancedReading ? <Sparkles size={22} /> : <LockKeyhole size={22} />}
      </span>
      <span className="premium-reading-cta-copy">
        <strong>{hasAdvancedReading ? "Xem lại luận giải nâng cao" : "Mở luận giải toàn bộ"}</strong>
        <small>{hasAdvancedReading ? "Đã mở khóa" : formatCoins(fullPriceCoins)}</small>
      </span>
    </>
  );
}

function PremiumCtaAction({
  chartId,
  fullName,
  hasAdvancedReading,
  fullPriceCoins,
  placement,
  modalId,
}: PremiumReadingCtaProps & { placement: "floating" | "bottom"; modalId: string }) {
  const className = `premium-reading-cta premium-reading-cta-${placement} ${hasAdvancedReading ? "premium-reading-cta-unlocked" : ""}`;

  if (hasAdvancedReading) {
    return (
      <Link href={`/la-so/${chartId}/nang-cao`} className={className} aria-label={`Xem lại luận giải nâng cao của ${fullName}`}>
        <PremiumCtaContent hasAdvancedReading fullPriceCoins={fullPriceCoins} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={`Mở luận giải toàn bộ của ${fullName}`}
      data-testid={`premium-reading-cta-${placement}`}
      popoverTarget={modalId}
    >
      <PremiumCtaContent hasAdvancedReading={false} fullPriceCoins={fullPriceCoins} />
    </button>
  );
}

function PremiumReadingConfirmModal({
  chartId,
  fullName,
  fullPriceCoins,
  modalId,
}: {
  chartId: string;
  fullName: string;
  fullPriceCoins: number;
  modalId: string;
}) {
  return (
    <section
      id={modalId}
      className="premium-confirm-modal premium-confirm-popover"
      role="dialog"
      aria-modal="true"
      aria-labelledby="premium-confirm-title"
      popover="auto"
      data-testid="premium-reading-confirm-modal"
    >
      <button type="button" className="premium-confirm-close" aria-label="Đóng" popoverTarget={modalId} popoverTargetAction="hide">
        <X size={18} />
      </button>

      <span className="premium-confirm-icon" aria-hidden="true">
        <Sparkles size={26} />
      </span>
      <p className="eyebrow">Xác nhận mở khóa</p>
      <h2 id="premium-confirm-title">Mở luận giải toàn bộ</h2>
      <p>
        Lá số của <strong>{fullName}</strong> sẽ được mở bản chuyên sâu và lưu lại để xem bất cứ lúc nào.
      </p>

      <div className="premium-confirm-price">
        <span>Chi phí</span>
        <strong>{formatCoins(fullPriceCoins)}</strong>
      </div>

      <p className="premium-confirm-note">
        Hệ thống sẽ kiểm tra số xu trong tài khoản. Nếu đủ xu, phần luận giải sẽ được mở và lưu lại; nếu chưa đủ, bạn sẽ được nhắc nạp thêm xu.
      </p>

      <form
        action={requestReadingAction}
        className="premium-confirm-actions"
        data-ad-event="paid_reading_request"
        data-ad-placement="premium_confirm_modal"
        data-ad-value={fullPriceCoins * 1000}
        data-loading-message="Đang mở luận giải..."
      >
        <input type="hidden" name="chartId" value={chartId} />
        <input type="hidden" name="type" value="FULL" />
        <input type="hidden" name="scopeKey" value="all" />
        <input type="hidden" name="next" value={`/la-so/${chartId}`} />
        <button type="button" className="btn btn-ghost" popoverTarget={modalId} popoverTargetAction="hide">
          Để sau
        </button>
        <LoadingSubmitButton className="btn btn-primary" loadingText="Đang mở..." data-testid="premium-reading-confirm-submit">
          Xác nhận mở khóa
        </LoadingSubmitButton>
      </form>
    </section>
  );
}

export function PremiumReadingCta(props: PremiumReadingCtaProps) {
  const modalId = premiumReadingModalId(props.chartId);

  return (
    <>
      <PremiumCtaAction {...props} placement="floating" modalId={modalId} />
      <PremiumCtaAction {...props} placement="bottom" modalId={modalId} />
      <PremiumReadingConfirmModal chartId={props.chartId} fullName={props.fullName} fullPriceCoins={props.fullPriceCoins} modalId={modalId} />
    </>
  );
}
