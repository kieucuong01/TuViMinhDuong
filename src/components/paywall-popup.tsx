"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Coins, LockKeyhole, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createCheckoutAction } from "@/app/actions";
import { COIN_PACKAGES } from "@/lib/pricing";
import { formatCoins, formatVnd } from "@/lib/format";

export function PaywallPopup() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dismissed, setDismissed] = useState(false);

  const cleanReturnTo = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    ["paywall", "need", "status", "orderCode"].forEach((key) => params.delete(key));
    const query = params.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);

  function close() {
    setDismissed(true);
    router.replace(cleanReturnTo, { scroll: false });
  }

  const notice = useMemo(() => {
    const reason = searchParams.get("paywall");
    if (reason === "login") {
      return {
        title: "Đăng nhập để mở luận giải",
        body: "Phần luận giải chuyên sâu cần tài khoản để lưu lịch sử lá số, trừ xu một lần và xem lại bất cứ lúc nào.",
        href: "/dang-nhap",
        cta: "Đăng nhập",
      };
    }
    if (reason === "coins") {
      const need = Number(searchParams.get("need") || 0);
      return {
        title: "Bạn chưa đủ xu",
        body: need > 0 ? `Bạn cần nạp thêm ${need} xu để mở khóa phần luận giải này.` : "Nạp xu để mở khóa phần luận giải chuyên sâu.",
        href: "/nap-xu",
        cta: "Nạp xu ngay",
      };
    }
    return null;
  }, [searchParams]);

  if (!notice || dismissed) return null;

  if (searchParams.get("paywall") === "coins") {
    return (
      <div className="paywall-modal-backdrop" role="presentation">
        <section className="paywall-modal" role="dialog" aria-modal="true" aria-labelledby="paywall-modal-title">
          <button className="paywall-modal-close" type="button" onClick={close} aria-label="Đóng nạp xu">
            <X size={18} />
          </button>
          <div className="paywall-modal-head">
            <span className="paywall-popup-icon" aria-hidden="true">
              <Coins size={21} />
            </span>
            <div>
              <p className="eyebrow">Nạp xu nhanh</p>
              <h2 id="paywall-modal-title">{notice.title}</h2>
              <p>{notice.body}</p>
            </div>
          </div>
          <div className="paywall-package-grid">
            {COIN_PACKAGES.map((pack) => (
              <form key={pack.key} action={createCheckoutAction} className="paywall-package-card">
                <input type="hidden" name="packageKey" value={pack.key} />
                <input type="hidden" name="returnTo" value={cleanReturnTo} />
                <strong>{pack.label}</strong>
                <span>{formatCoins(pack.coins + pack.bonusCoins)}</span>
                <p>{formatVnd(pack.priceVnd)}{pack.bonusCoins ? ` - tặng ${pack.bonusCoins} xu` : ""}</p>
                <button className="btn btn-primary w-full" type="submit">Nạp gói này</button>
              </form>
            ))}
          </div>
          <Link href="/nap-xu" className="paywall-modal-secondary" prefetch={false}>
            Xem trang nạp xu đầy đủ
          </Link>
        </section>
      </div>
    );
  }

  return (
    <aside className="paywall-popup" role="status" aria-live="polite">
      <span className="paywall-popup-icon" aria-hidden="true">
        <LockKeyhole size={20} />
      </span>
      <div>
        <strong>{notice.title}</strong>
        <p>{notice.body}</p>
        <Link href={notice.href} className="paywall-popup-link" prefetch={false}>
          {notice.cta}
        </Link>
      </div>
      <button type="button" onClick={close} aria-label="Đóng thông báo">
        <X size={17} />
      </button>
    </aside>
  );
}
