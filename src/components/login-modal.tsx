"use client";

import Link from "next/link";
import { useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Coins, History, ShieldCheck, X } from "lucide-react";
import { loginAction } from "@/app/actions";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { cleanLoginModalPath } from "@/components/login-modal-link";
import { isGoogleOAuthEnabled } from "@/lib/env";

function safeNext(path: string) {
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

export function LoginModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const isOpen = searchParams.get("login") === "1" && !pathname.startsWith("/dang-nhap");
  const returnTo = useMemo(() => cleanLoginModalPath(pathname, searchParams), [pathname, searchParams]);
  const next = safeNext(searchParams.get("next") || returnTo);
  const error = searchParams.get("authError");

  if (!isOpen) return null;

  function close() {
    startTransition(() => router.replace(returnTo, { scroll: false }));
  }

  return (
    <div
      className="paywall-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section className="paywall-modal login-modal" role="dialog" aria-modal="true" aria-labelledby="login-modal-title" data-testid="login-modal">
        <button className="paywall-modal-close" type="button" onClick={close} aria-label="Đóng đăng nhập" disabled={isPending}>
          <X size={18} />
        </button>

        <div className="paywall-modal-head">
          <div>
            <p className="eyebrow">Tài khoản</p>
            <h2 id="login-modal-title">Đăng nhập để tiếp tục</h2>
            <p>Đăng nhập ngay trên trang này để mở luận giải và quay lại đúng lá số bạn đang xem.</p>
          </div>
        </div>

        {error ? <p className="alert mt-4">{error}</p> : null}

        <form action={loginAction} className="login-modal-form mt-5 grid gap-3" data-loading-message="Đang đăng nhập..." data-loading-label="Đang xử lý...">
          <input type="hidden" name="next" value={next} />
          <input type="hidden" name="mode" value="modal" />
          <label>
            <span>Email</span>
            <input name="email" type="email" placeholder="ban@email.com" required data-testid="login-modal-email" />
          </label>
          <label>
            <span>Mật khẩu</span>
            <input name="password" type="password" minLength={6} placeholder="Tối thiểu 6 ký tự" required data-testid="login-modal-password" />
          </label>
          <LoadingSubmitButton className="btn btn-primary w-full" loadingText="Đang đăng nhập..." data-testid="login-modal-submit">
            Tiếp tục
          </LoadingSubmitButton>
        </form>

        <a
          className={`btn mt-3 w-full ${isGoogleOAuthEnabled() ? "btn-ghost" : "btn-disabled"}`}
          href={isGoogleOAuthEnabled() ? `/api/oauth/google/start?next=${encodeURIComponent(next)}` : "#"}
          aria-disabled={!isGoogleOAuthEnabled()}
        >
          Tiếp tục với Google
        </a>

        <div className="login-modal-benefits" aria-label="Lợi ích đăng nhập">
          <span><History size={17} /> Lưu lá số để xem lại sau</span>
          <span><ShieldCheck size={17} /> Nội dung đã mở được giữ trong tài khoản</span>
          <span><Coins size={17} /> Theo dõi số xu và lịch sử thanh toán</span>
        </div>

        <div className="coin-topup-footer mt-4">
          <button type="button" onClick={close}>Để tôi xem tiếp</button>
          <Link href="/dang-nhap" prefetch={false}>Mở trang đăng nhập đầy đủ</Link>
        </div>
      </section>
    </div>
  );
}
