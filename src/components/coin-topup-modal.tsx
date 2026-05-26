"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Coins, Sparkles, X } from "lucide-react";
import { useMemo, useTransition } from "react";
import { createCheckoutAction } from "@/app/actions";
import { COIN_PACKAGES } from "@/lib/pricing";
import { formatCoins, formatVnd } from "@/lib/format";
import { LoadingSubmitButton } from "@/components/loading-submit-button";

function cleanPath(pathname: string, searchParams: URLSearchParams) {
  const params = new URLSearchParams(searchParams.toString());
  ["topup", "paywall", "need", "status", "orderCode"].forEach((key) => params.delete(key));
  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}`;
}

export function topupHref(pathname: string, searchParams?: URLSearchParams | string, extra?: Record<string, string | number>) {
  const params = new URLSearchParams(typeof searchParams === "string" ? searchParams : searchParams?.toString());
  params.set("topup", "1");
  Object.entries(extra || {}).forEach(([key, value]) => params.set(key, String(value)));
  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}`;
}

export function CoinTopupModal({ enabled = true }: { enabled?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const isOpen = searchParams.get("topup") === "1" || searchParams.get("paywall") === "coins";
  const need = Number(searchParams.get("need") || 0);

  const returnTo = useMemo(() => cleanPath(pathname, searchParams), [pathname, searchParams]);
  const packages = useMemo(() => {
    const recommended = COIN_PACKAGES.find((pack) => pack.coins + pack.bonusCoins >= need) || COIN_PACKAGES[1];
    return COIN_PACKAGES.map((pack) => ({
      ...pack,
      totalCoins: pack.coins + pack.bonusCoins,
      recommended: pack.key === recommended.key,
    }));
  }, [need]);

  if (!isOpen || !enabled) return null;

  function close() {
    startTransition(() => router.replace(returnTo, { scroll: false }));
  }

  return (
    <div className="paywall-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) close();
    }}>
      <section className="paywall-modal coin-topup-modal" role="dialog" aria-modal="true" aria-labelledby="coin-topup-title" data-testid="coin-topup-modal">
        <button className="paywall-modal-close" type="button" onClick={close} aria-label="Đóng nạp xu" disabled={isPending}>
          <X size={18} />
        </button>

        <div className="paywall-modal-head">
          <span className="paywall-popup-icon" aria-hidden="true">
            <Coins size={21} />
          </span>
          <div>
            <p className="eyebrow">Nạp xu nhanh</p>
            <h2 id="coin-topup-title">{need > 0 ? "Bạn chưa đủ xu" : "Nạp xu để mở luận giải"}</h2>
            <p>
              {need > 0
                ? `Bạn cần nạp thêm ít nhất ${formatCoins(need)}. Chọn gói phù hợp, thanh toán xong sẽ quay lại đúng trang đang xem.`
                : "Chọn gói xu, thanh toán qua PayOS/VietQR rồi tiếp tục đọc lá số mà không mất màn hình hiện tại."}
            </p>
          </div>
        </div>

        <div className="coin-topup-note" role="note">
          <CheckCircle2 size={18} />
          <span>Mua một lần, nội dung đã mở sẽ được lưu trong tài khoản để xem lại.</span>
        </div>

        <div className="paywall-package-grid">
          {packages.map((pack) => (
            <form
              key={pack.key}
              action={createCheckoutAction}
              className={pack.recommended ? "paywall-package-card recommended" : "paywall-package-card"}
              data-loading-message="Đang tạo link thanh toán..."
              data-loading-label="Đang tạo link..."
            >
              <input type="hidden" name="packageKey" value={pack.key} />
              <input type="hidden" name="returnTo" value={returnTo} />
              {pack.recommended ? (
                <span className="coin-topup-badge">
                  <Sparkles size={14} /> Phù hợp nhất
                </span>
              ) : null}
              <strong>{pack.label}</strong>
              <span>{formatCoins(pack.totalCoins)}</span>
              <p>{formatVnd(pack.priceVnd)}{pack.bonusCoins ? ` - tặng ${pack.bonusCoins} xu` : ""}</p>
              <LoadingSubmitButton className="btn btn-primary w-full" loadingText="Đang tạo link...">Nạp gói này</LoadingSubmitButton>
            </form>
          ))}
        </div>

        <div className="coin-topup-footer">
          <button type="button" onClick={close}>Để tôi xem tiếp</button>
          <Link href="/nap-xu" prefetch={false}>Xem trang nạp xu đầy đủ</Link>
        </div>
      </section>
    </div>
  );
}
