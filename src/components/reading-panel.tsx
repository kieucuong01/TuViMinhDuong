import { requestReadingAction } from "@/app/actions";
import { FEATURE_PRICES, TEMPORARY_FULL_ACCESS, type ReadingKey } from "@/lib/pricing";
import { formatCoins } from "@/lib/format";
import type { TuViChart } from "@/lib/chart";

const options: { type: ReadingKey; scopeKey: string; label: string; description: string }[] = [
  { type: "FULL", scopeKey: "all", label: "Luận giải toàn bộ", description: "Mở đầy đủ tổng quan, 12 cung và vận trình chính." },
  { type: "PALACE", scopeKey: "Mệnh", label: "Luận cung Mệnh", description: "Đọc sâu tính cách, thế mạnh và điểm cần lưu ý." },
  { type: "DAI_VAN", scopeKey: "24-33", label: "Luận đại vận", description: "Nhịp vận 10 năm, cơ hội và rủi ro nổi bật." },
  { type: "NGUYET_VAN", scopeKey: "current-month", label: "Luận nguyệt vận", description: "Gợi ý hành động trong tháng hiện tại." },
  { type: "NHAT_VAN", scopeKey: "today", label: "Luận nhật vận", description: "Xem nhanh năng lượng hôm nay." },
];

export function ReadingPanel({ chartId, chart }: { chartId: string; chart: TuViChart }) {
  return (
    <section className="panel">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">{TEMPORARY_FULL_ACCESS ? "Full chức năng" : "Luận giải cần xu"}</p>
          <h2 className="section-title">Phân tích AI theo lá số</h2>
        </div>
        <p className="max-w-xl text-sm text-stone-600">
          {TEMPORARY_FULL_ACCESS
            ? "Giai đoạn thử nghiệm đang mở miễn phí toàn bộ phần luận giải. Bạn có thể xem ngay mà chưa cần nạp xu."
            : "AI nhận dữ liệu lá số đã an sao và viết luận giải bằng tiếng Việt. Nội dung mua một lần sẽ được lưu lại."}
        </p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {options.map((option) => {
          const price = FEATURE_PRICES[option.type].priceCoins;
          return (
            <form key={`${option.type}-${option.scopeKey}`} action={requestReadingAction} className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4 transition hover:-translate-y-1 hover:bg-white hover:shadow-lg">
              <input type="hidden" name="chartId" value={chartId} />
              <input type="hidden" name="type" value={option.type} />
              <input type="hidden" name="scopeKey" value={option.scopeKey} />
              <input type="hidden" name="next" value={`/la-so/${chartId}`} />
              <h3 className="font-black text-stone-950">{option.label}</h3>
              <p className="mt-1 min-h-12 text-sm leading-6 text-stone-600">{option.description}</p>
              <p className={TEMPORARY_FULL_ACCESS ? "mt-4 text-lg font-black text-emerald-700" : "mt-4 text-lg font-black text-orange-700"}>
                {TEMPORARY_FULL_ACCESS ? "Miễn phí" : formatCoins(price)}
              </p>
              <button className="btn btn-primary mt-4 w-full" type="submit">
                Xem luận giải
              </button>
              <p className="mt-2 text-xs text-stone-400">{chart.input.fullName}</p>
            </form>
          );
        })}
      </div>
    </section>
  );
}
