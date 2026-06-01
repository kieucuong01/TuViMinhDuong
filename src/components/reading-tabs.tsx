import { Sparkles } from "lucide-react";
import Link from "next/link";
import type { FeaturePriceMap, ReadingKey } from "@/lib/pricing";
import type { TuViChart } from "@/lib/chart";
import { formatCoins } from "@/lib/format";

const tabCards: { type: ReadingKey; view: string; title: string; body: string; value: string }[] = [
  {
    type: "PALACE",
    view: "luan-cung",
    title: "Luận cung",
    body: "Đọc kỹ từng cung như Mệnh, Tài Bạch, Quan Lộc, Phu Thê.",
    value: "Chọn đúng cung cần đọc, không phải mua cả lá số.",
  },
  {
    type: "DAI_VAN",
    view: "dai-van",
    title: "Đại vận",
    body: "Xem giai đoạn 10 năm, lúc nên tiến và lúc nên thận trọng.",
    value: "Mỗi giai đoạn có biểu đồ và nút mở riêng.",
  },
  {
    type: "TIEU_VAN",
    view: "tieu-van",
    title: "Tiểu vận",
    body: "Soi từng năm trong nền đại vận để biết trọng tâm cần chuẩn bị.",
    value: "Hữu ích khi cần quyết định cho năm đang xem.",
  },
  {
    type: "NGUYET_VAN",
    view: "nguyet-van",
    title: "Nguyệt vận",
    body: "Xem trọng tâm tháng hiện tại về việc làm, tiền bạc và quan hệ.",
    value: "Mở đúng tháng, đọc lại được trong tài khoản.",
  },
  {
    type: "NHAT_VAN",
    view: "nhat-van",
    title: "Nhật vận",
    body: "Xem nhanh điều nên chú ý trong ngày.",
    value: "Phù hợp khi cần chọn việc, giờ và nhịp ngày.",
  },
];

export function ReadingTabs({ chartId, chart, featurePrices }: { chartId: string; chart: TuViChart; featurePrices: FeaturePriceMap }) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Mở thêm khi cần</p>
          <h2 className="text-2xl font-black text-stone-950">Các phần luận giải chuyên sâu</h2>
        </div>
        <p className="max-w-lg text-base leading-7 text-stone-600">
          Mỗi mục chỉ trừ xu một lần và được lưu lại để xem sau.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {tabCards.map((card) => (
          <Link
            key={card.title}
            href={`/la-so/${chartId}?view=${card.view}`}
            className="unlock-card"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-100 text-orange-700">
              <Sparkles size={21} />
            </span>
            <h3>{card.title}</h3>
            <p>{card.body}</p>
            <p className="unlock-card-value">{card.value}</p>
            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                Từ {formatCoins(featurePrices[card.type].priceCoins)}
              </span>
              <span className="btn btn-primary btn-small">Chọn phần</span>
            </div>
            <p className="mt-3 text-sm text-stone-400">Áp dụng cho lá số {chart.input.fullName}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
