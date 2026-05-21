"use client";

import Link from "next/link";
import { LockKeyhole, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { requestReadingAction } from "@/app/actions";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { FEATURE_PRICES } from "@/lib/pricing";
import { formatCoins } from "@/lib/format";

type PremiumReadingCtaProps = {
  chartId: string;
  fullName: string;
  hasAdvancedReading: boolean;
};

function PremiumCtaContent({ hasAdvancedReading }: { hasAdvancedReading: boolean }) {
  return (
    <>
      <span className="premium-reading-cta-orb" aria-hidden="true">
        {hasAdvancedReading ? <Sparkles size={22} /> : <LockKeyhole size={22} />}
      </span>
      <span className="premium-reading-cta-copy">
        <strong>{hasAdvancedReading ? "Xem nâng cao" : "Mở luận giải toàn bộ"}</strong>
        <small>{hasAdvancedReading ? "Đã mở khóa" : formatCoins(FEATURE_PRICES.FULL.priceCoins)}</small>
      </span>
    </>
  );
}

function PremiumCtaAction({
  chartId,
  fullName,
  hasAdvancedReading,
  placement,
  onOpen,
}: PremiumReadingCtaProps & { placement: "floating" | "bottom"; onOpen: () => void }) {
  const className = `premium-reading-cta premium-reading-cta-${placement} ${hasAdvancedReading ? "premium-reading-cta-unlocked" : ""}`;

  if (hasAdvancedReading) {
    return (
      <Link href={`/la-so/${chartId}/nang-cao`} className={className} aria-label={`Xem luận giải nâng cao của ${fullName}`}>
        <PremiumCtaContent hasAdvancedReading />
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={`Mở luận giải toàn bộ của ${fullName}`}
      data-testid={`premium-reading-cta-${placement}`}
      onClick={onOpen}
    >
      <PremiumCtaContent hasAdvancedReading={false} />
    </button>
  );
}

function PremiumReadingConfirmModal({
  chartId,
  fullName,
  open,
  onClose,
}: {
  chartId: string;
  fullName: string;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="premium-confirm-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="premium-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-confirm-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="premium-confirm-close" onClick={onClose} aria-label="Đóng">
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
          <strong>{formatCoins(FEATURE_PRICES.FULL.priceCoins)}</strong>
        </div>

        <p className="premium-confirm-note">
          Hệ thống sẽ kiểm tra số xu trong tài khoản. Nếu đủ xu, phần luận giải sẽ được mở và lưu lại; nếu chưa đủ, bạn sẽ được nhắc nạp thêm xu.
        </p>

        <form action={requestReadingAction} className="premium-confirm-actions" data-loading-message="Đang mở luận giải...">
          <input type="hidden" name="chartId" value={chartId} />
          <input type="hidden" name="type" value="FULL" />
          <input type="hidden" name="scopeKey" value="all" />
          <input type="hidden" name="next" value={`/la-so/${chartId}`} />
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Để sau
          </button>
          <LoadingSubmitButton className="btn btn-primary" loadingText="Đang mở...">
            Xác nhận mở khóa
          </LoadingSubmitButton>
        </form>
      </section>
    </div>
  );
}

export function PremiumReadingCta(props: PremiumReadingCtaProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <PremiumCtaAction {...props} placement="floating" onOpen={() => setConfirmOpen(true)} />
      <PremiumCtaAction {...props} placement="bottom" onOpen={() => setConfirmOpen(true)} />
      <PremiumReadingConfirmModal
        chartId={props.chartId}
        fullName={props.fullName}
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}
