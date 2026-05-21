import { redirect } from "next/navigation";
import { Suspense } from "react";
import { loginAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import { isGoogleOAuthEnabled } from "@/lib/env";
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
      <section className="auth-card">
        <p className="eyebrow">Tài khoản</p>
        <h1>Đăng nhập hoặc tạo tài khoản</h1>
        <p className="text-sm text-stone-600">Dùng email và mật khẩu để tiếp tục. Nếu email chưa tồn tại hoặc từng mua nhanh chưa đặt mật khẩu, hệ thống sẽ tự tạo quyền truy cập cho bạn.</p>
        {params.error ? <p className="alert">{params.error}</p> : null}
        <form action={loginAction} className="mt-6 grid gap-4" data-loading-message="Đang đăng nhập..." data-loading-label="Đang xử lý...">
          <input type="hidden" name="next" value={params.next || "/"} />
          <label>
            <span>Email</span>
            <input name="email" type="email" placeholder="ban@email.com" required />
          </label>
          <label>
            <span>Mật khẩu</span>
            <input name="password" type="password" minLength={6} placeholder="Tối thiểu 6 ký tự" required />
          </label>
          <button className="btn btn-primary w-full" type="submit">Tiếp tục</button>
        </form>
        <a
          className={`btn mt-3 w-full ${isGoogleOAuthEnabled() ? "btn-ghost" : "btn-disabled"}`}
          href={isGoogleOAuthEnabled() ? `/api/oauth/google/start?next=${encodeURIComponent(params.next || "/")}` : "#"}
          aria-disabled={!isGoogleOAuthEnabled()}
        >
          Tiếp tục với Google
        </a>
      </section>
      <Suspense fallback={null}>
        <PaywallPopup />
      </Suspense>
    </main>
  );
}
