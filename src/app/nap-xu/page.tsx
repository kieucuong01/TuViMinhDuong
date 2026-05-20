import { Coins, CreditCard, ShieldCheck } from "lucide-react";
import { createCheckoutAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import { COIN_PACKAGES, TEMPORARY_FULL_ACCESS } from "@/lib/pricing";
import { formatCoins, formatVnd } from "@/lib/format";
import { isPayOSEnabled } from "@/lib/env";

export const metadata = {
  title: "Nạp xu",
  description: "Nạp xu để mở khóa luận giải tử vi AI qua PayOS/VietQR.",
  alternates: { canonical: "/nap-xu" },
};

export default async function CoinsPage({ searchParams }: { searchParams: Promise<{ status?: string; need?: string }> }) {
  const user = await getCurrentUser();
  const params = await searchParams;

  return (
    <main className="section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="section-heading">
          <p className="eyebrow">Nạp xu</p>
          <h1>{TEMPORARY_FULL_ACCESS ? "Nạp xu đang tạm tắt" : "Mở khóa luận giải chuyên sâu"}</h1>
          <p>
            {TEMPORARY_FULL_ACCESS
              ? "Giai đoạn thử nghiệm đang mở full chức năng miễn phí, nên thanh toán và trừ xu đang được chặn tạm thời."
              : "1 xu = 1.000đ. Thanh toán thật qua PayOS/VietQR khi cấu hình env; local dev có fallback demo."}
          </p>
        </div>
        {params.need ? <p className="alert mx-auto mb-6 max-w-2xl">Tính năng này hiện đang được mở miễn phí, bạn chưa cần nạp thêm xu.</p> : null}
        {params.status === "disabled" ? <p className="success mx-auto mb-6 max-w-2xl">Nạp xu đang tạm dừng vì hệ thống đang mở miễn phí toàn bộ luận giải.</p> : null}
        {params.status === "demo-paid" ? <p className="success mx-auto mb-6 max-w-2xl">Demo đã cộng xu vào phiên hiện tại.</p> : null}
        <div className="grid gap-4 md:grid-cols-3">
          {COIN_PACKAGES.map((pack) => (
            <form key={pack.key} action={createCheckoutAction} className="pricing-card">
              <input type="hidden" name="packageKey" value={pack.key} />
              <Coins className="text-orange-600" size={28} />
              <h2>{pack.label}</h2>
              <p className="text-3xl font-bold text-stone-950">{formatVnd(pack.priceVnd)}</p>
              <p className="text-stone-600">
                {formatCoins(pack.coins + pack.bonusCoins)} {pack.bonusCoins ? `(gồm ${pack.bonusCoins} xu bonus)` : ""}
              </p>
              <button className={TEMPORARY_FULL_ACCESS ? "btn btn-disabled w-full" : "btn btn-primary w-full"} type="submit" disabled={TEMPORARY_FULL_ACCESS || !user}>
                {TEMPORARY_FULL_ACCESS ? "Tạm dừng nạp xu" : "Nạp bằng PayOS"}
              </button>
              {!user && !TEMPORARY_FULL_ACCESS ? <p className="text-xs text-stone-500">Đăng nhập để nạp xu.</p> : null}
            </form>
          ))}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="feature-card"><CreditCard size={24} /><h3>PayOS/VietQR</h3><p>{isPayOSEnabled() ? "Đã bật cấu hình PayOS." : "Chưa có env PayOS, đang chạy chế độ demo."}</p></div>
          <div className="feature-card"><ShieldCheck size={24} /><h3>Webhook idempotent</h3><p>Chỉ cộng xu khi webhook hợp lệ, không cộng trùng order.</p></div>
          <div className="feature-card"><Coins size={24} /><h3>Coin ledger</h3><p>Mọi cộng/trừ xu được ghi nhận để kiểm tra lại khi bật lại paywall.</p></div>
        </div>
      </div>
    </main>
  );
}
