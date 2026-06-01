import { Check, Coins, CreditCard, ShieldCheck } from "lucide-react";
import { createCheckoutAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import { getOperationSettings } from "@/lib/data";
import { COIN_PACKAGES } from "@/lib/pricing";
import { formatCoins, formatVnd } from "@/lib/format";
import { routeMetadata } from "@/lib/metadata";
import { paymentReturnNotice } from "@/lib/payment-status";
import { LoadingSubmitButton } from "@/components/loading-submit-button";

export const metadata = routeMetadata({
  title: "Nạp xu mở luận giải tử vi",
  description: "Nạp xu để mở khóa luận giải tử vi qua PayOS/VietQR, xem lại nội dung đã mua trong tài khoản.",
  path: "/nap-xu",
  imageSubtitle: "Chọn gói xu, thanh toán nhanh và mở phần luận giải cần xem",
  robots: { index: false, follow: true },
});

export default async function CoinsPage({ searchParams }: { searchParams: Promise<{ status?: string; need?: string; orderCode?: string }> }) {
  const user = await getCurrentUser();
  const [params, operationSettings] = await Promise.all([searchParams, getOperationSettings()]);
  const notice = paymentReturnNotice(params.status, params.orderCode);
  const topupEnabled = operationSettings.paymentsEnabled && operationSettings.coinTopupEnabled;

  return (
    <main className="section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="section-heading">
          <p className="eyebrow">Nạp xu</p>
          <h1>Mở khóa luận giải chuyên sâu</h1>
          <p>
            1 xu = 1.000đ. Chọn gói phù hợp, thanh toán xong có thể dùng xu để mở các phần luận giải.
          </p>
        </div>
        {params.need ? <p className="alert mx-auto mb-6 max-w-2xl">Bạn cần nạp thêm {params.need} xu để mở phần vừa chọn.</p> : null}
        {notice ? <p className={`${notice.tone === "success" ? "success" : "alert"} mx-auto mb-6 max-w-2xl`}>{notice.message}</p> : null}
        {!topupEnabled ? (
          <p className="alert mx-auto mb-6 max-w-2xl">Nạp xu đang được tắt trong cấu hình vận hành. Người dùng public chỉ xem bản cơ bản cho đến khi admin bật lại.</p>
        ) : null}
        <div className="checkout-trust-band" aria-label="Lý do nên đăng nhập và nạp xu">
          <span><Check size={17} /> Xu vào tài khoản sau khi thanh toán thành công</span>
          <span><Check size={17} /> Mở phần nào dùng phần đó, không ép mua gói lớn</span>
          <span><Check size={17} /> Nội dung đã mở được lưu để xem lại</span>
        </div>
        {topupEnabled ? <div className="grid gap-4 md:grid-cols-3">
          {COIN_PACKAGES.map((pack) => (
            <form
              key={pack.key}
              action={createCheckoutAction}
              className="pricing-card"
              data-ad-event="begin_checkout"
              data-ad-placement="topup_page"
              data-ad-package={pack.key}
              data-ad-value={pack.priceVnd}
              data-loading-message="Đang tạo link thanh toán..."
              data-loading-label="Đang tạo link..."
            >
              <input type="hidden" name="packageKey" value={pack.key} />
              <Coins className="text-orange-600" size={30} />
              <h2>{pack.label}</h2>
              <p className="text-3xl font-bold text-stone-950">{formatVnd(pack.priceVnd)}</p>
              <p className="text-stone-600">
                Nhận {formatCoins(pack.coins + pack.bonusCoins)} {pack.bonusCoins ? `(tặng thêm ${pack.bonusCoins} xu)` : ""}
              </p>
              <LoadingSubmitButton className="btn btn-primary btn-large w-full" loadingText="Đang tạo link..." disabled={!user}>
                Nạp xu
              </LoadingSubmitButton>
              {!user ? <p className="text-sm leading-6 text-stone-500">Bạn cần đăng nhập để nạp xu và lưu lịch sử.</p> : null}
            </form>
          ))}
        </div> : null}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="feature-card"><CreditCard size={26} /><h3>Thanh toán rõ ràng</h3><p>Giá gói và số xu nhận được hiển thị trước khi thanh toán.</p></div>
          <div className="feature-card"><ShieldCheck size={26} /><h3>Không trừ lại khi xem</h3><p>Nội dung đã mở sẽ được lưu để bạn xem lại trong tài khoản.</p></div>
          <div className="feature-card"><Coins size={26} /><h3>Dùng đúng nhu cầu</h3><p>Bạn có thể mở toàn bộ hoặc chỉ mở từng phần như Đại vận, Nguyệt vận, Nhật vận.</p></div>
        </div>
      </div>
    </main>
  );
}
