"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Coins, LockKeyhole, X } from "lucide-react";
import { useMemo, useState } from "react";
import { loginModalHref } from "@/components/login-modal-link";

type PaywallNotice = {
  icon: "lock" | "coins";
  title: string;
  body: string;
  href: string;
  cta: string;
};

export function PaywallPopup() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dismissed, setDismissed] = useState(false);

  const cleanReturnTo = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    ["paywall", "paid", "need", "status", "orderCode", "login", "next", "authError"].forEach((key) => params.delete(key));
    const query = params.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);

  function close() {
    setDismissed(true);
    router.replace(cleanReturnTo, { scroll: false });
  }

  const notice = useMemo<PaywallNotice | null>(() => {
    const reason = searchParams.get("paywall");
    const paidStatus = searchParams.get("paid");
    if (paidStatus === "disabled") {
      return {
        icon: "lock",
        title: "Luận giải chuyên sâu đang tắt",
        body: "Admin đang tắt các phần trả phí với public. Bạn vẫn có thể xem lá số và bản luận giải cơ bản miễn phí.",
        href: cleanReturnTo,
        cta: "Quay lại lá số",
      };
    }

    if (reason === "login") {
      return {
        icon: "lock",
        title: "Đăng nhập để mở luận giải",
        body: "Phần luận giải chuyên sâu cần tài khoản để lưu lịch sử lá số, trừ xu một lần và xem lại bất cứ lúc nào.",
        href: loginModalHref(pathname, searchParams, cleanReturnTo),
        cta: "Đăng nhập",
      };
    }

    if (reason === "coins") {
      const need = Number(searchParams.get("need") || 0);
      return {
        icon: "coins",
        title: "Chưa đủ xu để mở luận giải",
        body:
          need > 0
            ? `Bạn cần nạp thêm ${need} xu để mở phần luận giải này.`
            : "Số dư xu hiện tại chưa đủ để mở phần luận giải này.",
        href: `/nap-xu?returnTo=${encodeURIComponent(cleanReturnTo)}`,
        cta: "Nạp xu ngay",
      };
    }

    return null;
  }, [cleanReturnTo, pathname, searchParams]);

  if (!notice || dismissed) return null;

  return (
    <aside className="paywall-popup" role="status" aria-live="polite" data-testid="paywall-popup">
      <span className="paywall-popup-icon" aria-hidden="true">
        {notice.icon === "coins" ? <Coins size={20} /> : <LockKeyhole size={20} />}
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
