import { Sparkles } from "lucide-react";
import { requestReadingAction } from "@/app/actions";
import { FEATURE_PRICES, type ReadingKey } from "@/lib/pricing";
import type { TuViChart } from "@/lib/chart";
import { formatCoins } from "@/lib/format";

const tabCards: { type: ReadingKey; scopeKey: string; title: string; body: string }[] = [
  {
    type: "PALACE",
    scopeKey: "Mệnh",
    title: "Luận cung",
    body: "Đọc kỹ từng cung như Mệnh, Tài Bạch, Quan Lộc, Phu Thê.",
  },
  {
    type: "DAI_VAN",
    scopeKey: "current-decade",
    title: "Đại vận",
    body: "Xem giai đoạn 10 năm, lúc nên tiến và lúc nên thận trọng.",
  },
  {
    type: "NGUYET_VAN",
    scopeKey: "current-month",
    title: "Nguyệt vận",
    body: "Xem trọng tâm tháng hiện tại về việc làm, tiền bạc và quan hệ.",
  },
  {
    type: "NHAT_VAN",
    scopeKey: "today",
    title: "Nhật vận",
    body: "Xem nhanh điều nên chú ý trong ngày.",
  },
];

export function ReadingTabs({ chartId, chart }: { chartId: string; chart: TuViChart }) {
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tabCards.map((card) => (
          <form
            key={card.title}
            action={requestReadingAction}
            className="unlock-card"
            data-loading-message="Đang mở phần luận giải..."
            data-loading-label="Đang mở..."
          >
            <input type="hidden" name="chartId" value={chartId} />
            <input type="hidden" name="type" value={card.type} />
            <input type="hidden" name="scopeKey" value={card.scopeKey} />
            <input type="hidden" name="next" value={`/la-so/${chartId}`} />
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-100 text-orange-700">
              <Sparkles size={21} />
            </span>
            <h3>{card.title}</h3>
            <p>{card.body}</p>
            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                Giá rõ ràng
              </span>
              <button className="btn btn-primary btn-small" type="submit">
                {formatCoins(FEATURE_PRICES[card.type].priceCoins)}
              </button>
            </div>
            <p className="mt-3 text-sm text-stone-400">Áp dụng cho lá số {chart.input.fullName}</p>
          </form>
        ))}
      </div>
    </section>
  );
}
