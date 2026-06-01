import Link from "next/link";
import type { FeaturePriceMap, ReadingKey } from "@/lib/pricing";
import { formatCoins } from "@/lib/format";
import type { TuViChart } from "@/lib/chart";

const options: { type: ReadingKey; href: (chartId: string) => string; label: string; description: string; cta: string }[] = [
  { type: "FULL", href: (chartId) => `/la-so/${chartId}/nang-cao`, label: "Luận giải toàn bộ", description: "Xem lại bản chuyên sâu, các chương chính và gợi ý hành động.", cta: "Đọc bản toàn bộ" },
  { type: "PALACE", href: (chartId) => `/la-so/${chartId}?view=luan-cung`, label: "Luận cung", description: "Chọn từng cung như Mệnh, Tài Bạch, Quan Lộc để mở đúng phần cần đọc.", cta: "Chọn cung" },
  { type: "DAI_VAN", href: (chartId) => `/la-so/${chartId}?view=dai-van`, label: "Luận đại vận", description: "Chọn đúng giai đoạn 10 năm, nhìn cơ hội và rủi ro dài hạn.", cta: "Chọn đại vận" },
  { type: "TIEU_VAN", href: (chartId) => `/la-so/${chartId}?view=tieu-van`, label: "Luận tiểu vận", description: "Đọc từng năm trong nền đại vận để biết việc nên chuẩn bị.", cta: "Chọn năm" },
  { type: "NGUYET_VAN", href: (chartId) => `/la-so/${chartId}?view=nguyet-van`, label: "Luận nguyệt vận", description: "Chọn từng tháng, đọc trọng tâm công việc, tiền bạc và quan hệ.", cta: "Chọn tháng" },
  { type: "NHAT_VAN", href: (chartId) => `/la-so/${chartId}?view=nhat-van`, label: "Luận nhật vận", description: "Xem ngày đang quan tâm với gợi ý việc nên làm và giờ tốt.", cta: "Xem ngày" },
];

export function ReadingPanel({ chartId, chart, featurePrices }: { chartId: string; chart: TuViChart; featurePrices: FeaturePriceMap }) {
  return (
    <section className="panel">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Mở thêm khi cần</p>
          <h2 className="section-title">Các phần luận giải chuyên sâu</h2>
        </div>
        <p className="max-w-xl text-base leading-7 text-stone-600">
          Mỗi phần đều hiển thị giá rõ ràng. Mua một lần, nội dung sẽ được lưu lại để xem sau.
        </p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => {
          const price = featurePrices[option.type].priceCoins;
          return (
            <Link
              key={option.type}
              href={option.href(chartId)}
              className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4 transition hover:-translate-y-1 hover:bg-white hover:shadow-lg"
            >
              <h3 className="text-lg font-black text-stone-950">{option.label}</h3>
              <p className="mt-2 min-h-14 text-base leading-7 text-stone-600">{option.description}</p>
              <p className="mt-4 text-xl font-black text-orange-700">
                {option.type === "FULL" ? "Đã mở trong bản này" : `Từ ${formatCoins(price)}`}
              </p>
              <span className="btn btn-primary mt-4 w-full">{option.cta}</span>
              <p className="mt-2 text-sm text-stone-400">{chart.input.fullName}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
