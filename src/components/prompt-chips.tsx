import { requestReadingAction } from "@/app/actions";
import type { TuViChart } from "@/lib/chart";

const prompts = [
  { label: "Tìm hiểu Cung Mệnh", type: "PALACE", scopeKey: "Mệnh" },
  { label: "Bí mật ở Cung Quan Lộc", type: "PALACE", scopeKey: "Quan Lộc" },
  { label: "Xem vận 10 năm tới", type: "DAI_VAN", scopeKey: "next-decade" },
  { label: "Tháng này nên làm gì?", type: "NGUYET_VAN", scopeKey: "current-month" },
];

const defaultShellClassName = "mt-8 rounded-2xl border border-orange-100 bg-white/85 p-4 shadow-sm backdrop-blur";

export function PromptChips({ chartId, chart, className = defaultShellClassName }: { chartId: string; chart: TuViChart; className?: string }) {
  return (
    <section className={className}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow mb-1">Gợi ý hỏi nhanh</p>
          <h2 className="text-lg font-black text-stone-950">Bạn muốn đào sâu phần nào của lá số?</h2>
        </div>
        <p className="text-sm text-stone-500">{chart.input.fullName}</p>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {prompts.map((prompt) => (
          <form
            key={prompt.label}
            action={requestReadingAction}
            data-loading-message="Đang mở phần luận giải..."
            data-loading-label="Đang mở..."
          >
            <input type="hidden" name="chartId" value={chartId} />
            <input type="hidden" name="type" value={prompt.type} />
            <input type="hidden" name="scopeKey" value={prompt.scopeKey} />
            <input type="hidden" name="next" value={`/la-so/${chartId}`} />
            <button className="prompt-chip w-full" type="submit">
              {prompt.label}
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}
