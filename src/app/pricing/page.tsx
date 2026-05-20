import Link from "next/link";
import { Check, Coins, Sparkles, TrendingUp } from "lucide-react";
import { COIN_PACKAGES, FEATURE_PRICES } from "@/lib/pricing";
import { formatCoins, formatVnd } from "@/lib/format";
import { APP_NAME } from "@/lib/env";

export const metadata = {
  title: "Bảng giá luận giải tử vi AI",
  description: `Bảng giá xu cho luận giải toàn bộ, luận cung, đại vận, nguyệt vận và nhật vận trên ${APP_NAME}.`,
  alternates: { canonical: "/pricing" },
};

const featureRows = [
  { label: "Luận giải toàn bộ", detail: "Tổng quan, 12 cung, vận hạn và gợi ý hành động", price: FEATURE_PRICES.FULL.priceCoins },
  { label: "Luận cung", detail: "Đào sâu một cung như Mệnh, Quan Lộc, Tài Bạch", price: FEATURE_PRICES.PALACE.priceCoins },
  { label: "Đại vận", detail: "Nhịp 10 năm, cơ hội và điểm cần thận trọng", price: FEATURE_PRICES.DAI_VAN.priceCoins },
  { label: "Nguyệt vận", detail: "Trọng tâm tháng hiện tại theo lá số", price: FEATURE_PRICES.NGUYET_VAN.priceCoins },
  { label: "Nhật vận", detail: "Gợi ý nhanh cho một ngày cụ thể", price: FEATURE_PRICES.NHAT_VAN.priceCoins },
];

const benefits = [
  "AI chỉ luận từ dữ liệu lá số đã an sao, không tự tính lại.",
  "Mua một lần, đọc lại không trừ thêm xu.",
  "Nếu quá trình AI lỗi sau khi trừ xu, hệ thống hoàn xu bằng ledger.",
];

export default function PricingPage() {
  return (
    <main className="pricing-hero">
      <section className="section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
            <div>
              <p className="eyebrow">Bảng giá</p>
              <h1 className="section-title max-w-3xl">Minh bạch chi phí trước khi mở khóa luận giải</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
                Quy ước đơn giản: 1 xu = 1.000đ. Bạn có thể nạp theo gói, rồi dùng xu cho từng phần luận giải đúng nhu cầu.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/nap-xu" className="btn btn-primary">
                  <Coins size={18} /> Nạp xu
                </Link>
                <Link href="/#lap-la-so" className="btn btn-ghost">
                  <Sparkles size={18} /> Lập lá số
                </Link>
              </div>
            </div>

            <aside className="panel">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="eyebrow mb-1">Khuyến nghị</p>
                  <h2 className="text-2xl font-black text-stone-950">Gói luận toàn bộ</h2>
                </div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-700">
                  <TrendingUp size={24} />
                </span>
              </div>
              <p className="mt-3 text-stone-600">Phù hợp khi người dùng muốn xem đầy đủ trước, sau đó đào sâu từng cung khi cần.</p>
              <p className="mt-5 text-4xl font-black text-orange-700">{formatCoins(FEATURE_PRICES.FULL.priceCoins)}</p>
              <Link href="/nap-xu" className="btn btn-primary mt-5 w-full">
                Chọn gói phù hợp
              </Link>
            </aside>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8">
          <div className="panel p-0">
            <div className="pricing-row bg-orange-50/70 font-black text-stone-950">
              <span>Tính năng</span>
              <span>Mô tả</span>
              <span>Giá</span>
              <span>Trạng thái</span>
            </div>
            {featureRows.map((row) => (
              <div key={row.label} className="pricing-row">
                <strong className="text-stone-950">{row.label}</strong>
                <span className="text-stone-600">{row.detail}</span>
                <span className="font-black text-orange-700">{formatCoins(row.price)}</span>
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  <Check size={14} /> Đã có
                </span>
              </div>
            ))}
          </div>

          <div className="grid gap-4">
            {COIN_PACKAGES.map((pack) => (
              <Link key={pack.key} href="/nap-xu" className="pricing-card block">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2>{pack.label}</h2>
                    <p className="text-sm">{formatCoins(pack.coins + pack.bonusCoins)}</p>
                  </div>
                  <p className="text-xl font-black text-stone-950">{formatVnd(pack.priceVnd)}</p>
                </div>
                {pack.bonusCoins ? <p className="mt-3 text-sm font-bold text-emerald-700">Tặng thêm {pack.bonusCoins} xu</p> : null}
              </Link>
            ))}
          </div>
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
