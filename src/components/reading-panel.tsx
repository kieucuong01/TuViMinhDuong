import { requestReadingAction } from "@/app/actions";
import { FEATURE_PRICES, type ReadingKey } from "@/lib/pricing";
import { formatCoins } from "@/lib/format";
import type { TuViChart } from "@/lib/chart";

const options: { type: ReadingKey; scopeKey: string; label: string; description: string }[] = [
  { type: "FULL", scopeKey: "all", label: "Luận giải toàn bộ", description: "Xem tổng quan, 12 cung và vận trình chính." },
  { type: "PALACE", scopeKey: "Mệnh", label: "Luận cung Mệnh", description: "Đọc kỹ hơn về tính cách, thế mạnh và điều cần lưu ý." },
  { type: "DAI_VAN", scopeKey: "24-33", label: "Luận đại vận", description: "Xem giai đoạn 10 năm, cơ hội và thử thách nổi bật." },
  { type: "NGUYET_VAN", scopeKey: "current-month", label: "Luận nguyệt vận", description: "Gợi ý trọng tâm trong tháng hiện tại." },
  { type: "NHAT_VAN", scopeKey: "today", label: "Luận nhật vận", description: "Xem nhanh năng lượng và việc nên chú ý hôm nay." },
];

export function ReadingPanel({ chartId, chart }: { chartId: string; chart: TuViChart }) {
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
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {options.map((option) => {
          const price = FEATURE_PRICES[option.type].priceCoins;
          return (
            <form
              key={`${option.type}-${option.scopeKey}`}
              action={requestReadingAction}
              className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4 transition hover:-translate-y-1 hover:bg-white hover:shadow-lg"
              data-loading-message="Đang mở phần luận giải..."
              data-loading-label="Đang mở..."
            >
              <input type="hidden" name="chartId" value={chartId} />
              <input type="hidden" name="type" value={option.type} />
              <input type="hidden" name="scopeKey" value={option.scopeKey} />
              <input type="hidden" name="next" value={`/la-so/${chartId}`} />
              <h3 className="text-lg font-black text-stone-950">{option.label}</h3>
              <p className="mt-2 min-h-14 text-base leading-7 text-stone-600">{option.description}</p>
              <p className="mt-4 text-xl font-black text-orange-700">
                {formatCoins(price)}
              </p>
              <button className="btn btn-primary mt-4 w-full" type="submit">
                Mở phần này
              </button>
              <p className="mt-2 text-sm text-stone-400">{chart.input.fullName}</p>
            </form>
          );
        })}
      </div>
    </section>
  );
}
