import Link from "next/link";
import { Check, Coins, Sparkles, TrendingUp } from "lucide-react";
import { COIN_PACKAGES, FEATURE_PRICES } from "@/lib/pricing";
import { getOperationSettings } from "@/lib/data";
import { formatCoins, formatVnd } from "@/lib/format";
import { APP_NAME } from "@/lib/env";
import { routeMetadata } from "@/lib/metadata";

export const metadata = routeMetadata({
  title: "Bảng giá luận giải tử vi",
  description: `Bảng giá xu cho luận giải toàn bộ, luận cung, đại vận, nguyệt vận và nhật vận trên ${APP_NAME}.`,
  path: "/pricing",
  imageSubtitle: "Giá rõ ràng trước khi mở luận giải, mua một lần xem lại",
});

const featureRows = [
  { label: "Luận giải toàn bộ", detail: "Tổng quan, 12 cung, vận hạn và gợi ý hành động", price: FEATURE_PRICES.FULL.priceCoins },
  { label: "Luận cung", detail: "Xem sâu một cung như Mệnh, Quan Lộc, Tài Bạch", price: FEATURE_PRICES.PALACE.priceCoins },
  { label: "Đại vận", detail: "Giai đoạn 10 năm, cơ hội và điều cần thận trọng", price: FEATURE_PRICES.DAI_VAN.priceCoins },
  { label: "Tiểu vận", detail: "Từng năm trong nền đại vận, việc nên chuẩn bị", price: FEATURE_PRICES.TIEU_VAN.priceCoins },
  { label: "Nguyệt vận", detail: "Trọng tâm tháng hiện tại theo lá số", price: FEATURE_PRICES.NGUYET_VAN.priceCoins },
  { label: "Nhật vận", detail: "Gợi ý nhanh cho một ngày cụ thể", price: FEATURE_PRICES.NHAT_VAN.priceCoins },
];

const benefits = [
  "Giá hiển thị trước khi mở khóa.",
  "Mua một lần, đọc lại không trừ thêm xu.",
  "Nếu quá trình tạo luận giải lỗi sau khi trừ xu, hệ thống sẽ hoàn xu.",
];

export default async function PricingPage() {
  const operationSettings = await getOperationSettings();
  const commercialEnabled = operationSettings.paymentsEnabled && operationSettings.coinTopupEnabled && operationSettings.paidReadingsEnabled;

  return (
    <main className="pricing-hero">
      <section className="section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
            <div>
              <p className="eyebrow">Bảng giá</p>
              <h1 className="section-title max-w-3xl">Biết rõ chi phí trước khi mở luận giải</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
                1 xu = 1.000đ. Bạn có thể nạp theo gói, rồi dùng xu cho phần luận giải mình cần.
              </p>
              <div className="pricing-trust-list" aria-label="Cam kết khi mở luận giải">
                <span><Check size={17} /> Không trừ lại khi xem lại</span>
                <span><Check size={17} /> Giá hiện rõ trước khi mở</span>
                <span><Check size={17} /> Lưu lịch sử xu trong tài khoản</span>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {commercialEnabled ? <Link href="/pricing?topup=1" className="btn btn-primary btn-large" prefetch={false}>
                  <Coins size={20} /> Nạp xu
                </Link> : null}
                <Link href="/#lap-la-so" className="btn btn-ghost btn-large">
                  <Sparkles size={20} /> Lập lá số
                </Link>
              </div>
            </div>

            <aside className="panel">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="eyebrow mb-1">Gợi ý</p>
                  <h2 className="text-2xl font-black text-stone-950">Gói luận toàn bộ</h2>
                </div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-700">
                  <TrendingUp size={24} />
                </span>
              </div>
              <p className="mt-3 text-lg leading-8 text-stone-600">Phù hợp khi bạn muốn xem đầy đủ trước, sau đó đọc sâu từng phần khi cần.</p>
              <p className="mt-5 text-4xl font-black text-orange-700">{formatCoins(FEATURE_PRICES.FULL.priceCoins)}</p>
              {commercialEnabled ? <Link href="/pricing?topup=1" className="btn btn-primary btn-large mt-5 w-full" prefetch={false}>
                Nạp xu để mở luận giải
              </Link> : <p className="alert mt-5">Luận giải chuyên sâu đang tắt với public. Bạn vẫn có thể lập lá số và đọc bản cơ bản miễn phí.</p>}
            </aside>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8">
          <div className="panel p-0">
            <div className="pricing-row bg-orange-50/70 font-black text-stone-950">
              <span>Phần luận giải</span>
              <span>Nội dung</span>
              <span>Giá</span>
              <span>Trạng thái</span>
            </div>
            {featureRows.map((row) => (
              <div key={row.label} className="pricing-row">
                <strong className="text-stone-950">{row.label}</strong>
                <span className="text-stone-600">{row.detail}</span>
                <span className="font-black text-orange-700">{formatCoins(row.price)}</span>
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                  <Check size={15} /> Đã có
                </span>
              </div>
            ))}
          </div>

          {commercialEnabled ? <div className="grid gap-4">
            {COIN_PACKAGES.map((pack) => (
              <Link key={pack.key} href="/pricing?topup=1" className="pricing-card block" prefetch={false}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2>{pack.label}</h2>
                    <p className="text-base">{formatCoins(pack.coins + pack.bonusCoins)}</p>
                  </div>
                  <p className="text-xl font-black text-stone-950">{formatVnd(pack.priceVnd)}</p>
                </div>
                {pack.bonusCoins ? <p className="mt-3 text-base font-bold text-emerald-700">Tặng thêm {pack.bonusCoins} xu</p> : null}
              </Link>
            ))}
          </div> : null}
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
          {benefits.map((benefit) => (
            <div key={benefit} className="feature-card">
              <Check className="text-emerald-600" size={24} />
              <p>{benefit}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
