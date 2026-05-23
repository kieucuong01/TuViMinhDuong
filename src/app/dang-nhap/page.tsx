import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Coins, History, ShieldCheck } from "lucide-react";
import { loginAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import { isGoogleOAuthEnabled } from "@/lib/env";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { PaywallPopup } from "@/components/paywall-popup";

export const metadata = {
  title: "Đăng nhập",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(params.next || "/");

  return (
    <main className="auth-shell">
      <div className="auth-layout">
        <section className="auth-card">
          <p className="eyebrow">Tài khoản</p>
          <h1>Đăng nhập hoặc tạo tài khoản</h1>
          <p className="text-sm text-stone-600">Dùng email và mật khẩu để tiếp tục. Nếu email chưa tồn tại hoặc từng mua nhanh chưa đặt mật khẩu, hệ thống sẽ tự tạo quyền truy cập cho bạn.</p>
          {params.error ? <p className="alert">{params.error}</p> : null}
          <form action={loginAction} className="mt-6 grid gap-4" data-testid="login-form" data-loading-message="Đang đăng nhập..." data-loading-label="Đang xử lý...">
            <input type="hidden" name="next" value={params.next || "/"} />
            <label>
              <span>Email</span>
              <input name="email" type="email" placeholder="ban@email.com" required data-testid="login-email" />
            </label>
            <label>
              <span>Mật khẩu</span>
              <input name="password" type="password" minLength={6} placeholder="Tối thiểu 6 ký tự" required data-testid="login-password" />
            </label>
            <LoadingSubmitButton className="btn btn-primary w-full" loadingText="Đang đăng nhập...">Tiếp tục</LoadingSubmitButton>
          </form>
          <a
            className={`btn mt-3 w-full ${isGoogleOAuthEnabled() ? "btn-ghost" : "btn-disabled"}`}
            href={isGoogleOAuthEnabled() ? `/api/oauth/google/start?next=${encodeURIComponent(params.next || "/")}` : "#"}
            aria-disabled={!isGoogleOAuthEnabled()}
          >
            Tiếp tục với Google
          </a>
        </section>
        <aside className="auth-benefit-panel" aria-label="Lợi ích tài khoản">
          <p className="eyebrow">Giữ trải nghiệm liền mạch</p>
          <h2>Lưu lá số, luận giải và lịch sử xu của bạn</h2>
          <div className="auth-benefit-list">
            <span><History size={19} /> Xem lại các lá số đã lập</span>
            <span><ShieldCheck size={19} /> Không trừ lại xu với nội dung đã mở</span>
            <span><Coins size={19} /> Theo dõi số xu và lần nạp gần nhất</span>
          </div>
        </aside>
      </div>
      <Suspense fallback={null}>
        <PaywallPopup />
      </Suspense>
    </main>
  );
}
