import Link from "next/link";
import { LockKeyhole, Sparkles } from "lucide-react";
import { requestReadingAction } from "@/app/actions";
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
}: PremiumReadingCtaProps & { placement: "floating" | "bottom" }) {
  const className = `premium-reading-cta premium-reading-cta-${placement} ${hasAdvancedReading ? "premium-reading-cta-unlocked" : ""}`;

  if (hasAdvancedReading) {
    return (
      <Link href={`/la-so/${chartId}/nang-cao`} className={className} aria-label={`Xem luận giải nâng cao của ${fullName}`}>
        <PremiumCtaContent hasAdvancedReading />
      </Link>
    );
  }

  return (
    <form action={requestReadingAction} className={className} aria-label={`Mở luận giải toàn bộ của ${fullName}`}>
      <input type="hidden" name="chartId" value={chartId} />
      <input type="hidden" name="type" value="FULL" />
      <input type="hidden" name="scopeKey" value="all" />
      <input type="hidden" name="next" value={`/la-so/${chartId}`} />
      <button type="submit">
        <PremiumCtaContent hasAdvancedReading={false} />
      </button>
    </form>
  );
}

export function PremiumReadingCta(props: PremiumReadingCtaProps) {
  return (
    <>
      <PremiumCtaAction {...props} placement="floating" />
      <PremiumCtaAction {...props} placement="bottom" />
    </>
  );
}
