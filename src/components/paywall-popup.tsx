"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LockKeyhole, X } from "lucide-react";
import { useMemo, useState } from "react";

export function PaywallPopup() {
  const searchParams = useSearchParams();
  const [dismissed, setDismissed] = useState(false);

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
      <button type="button" onClick={() => setDismissed(true)} aria-label="Đóng thông báo">
        <X size={17} />
      </button>
    </aside>
  );
}
