import { Sparkles } from "lucide-react";
import { requestReadingAction } from "@/app/actions";
import { TEMPORARY_FULL_ACCESS, type ReadingKey } from "@/lib/pricing";
import type { TuViChart } from "@/lib/chart";

const tabCards: { type: ReadingKey; scopeKey: string; title: string; body: string }[] = [
  {
    type: "PALACE",
    scopeKey: "Mệnh",
    title: "Luận cung",
    body: "Đọc từng cung theo chính tinh, phụ tinh và trạng thái mạnh yếu để hiểu từng lĩnh vực đời sống.",
  },
  {
    type: "DAI_VAN",
    scopeKey: "current-decade",
    title: "Đại vận",
    body: "Phân tích nhịp 10 năm, giai đoạn nên tiến, nên thủ và hướng ra quyết định dài hạn.",
  },
  {
    type: "NGUYET_VAN",
    scopeKey: "current-month",
    title: "Nguyệt vận",
    body: "Gợi ý trọng tâm tháng hiện tại: công việc, tài chính, quan hệ và điều cần tránh.",
  },
  {
    type: "NHAT_VAN",
    scopeKey: "today",
    title: "Nhật vận",
    body: "Xem nhanh năng lượng trong ngày và các việc nên ưu tiên để hành động tỉnh táo hơn.",
  },
];

export function ReadingTabs({ chartId, chart }: { chartId: string; chart: TuViChart }) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">{TEMPORARY_FULL_ACCESS ? "Đang mở miễn phí" : "Mở khóa theo nhu cầu"}</p>
          <h2 className="text-2xl font-black text-stone-950">Các lớp luận giải chuyên sâu</h2>
        </div>
        <p className="max-w-lg text-sm leading-6 text-stone-600">
          {TEMPORARY_FULL_ACCESS
            ? "Tạm thời tất cả phần luận giải đều dùng được ngay, chưa cần đăng nhập hay nạp xu."
            : "Mỗi mục chỉ trừ xu một lần và được lưu lại trong tài khoản của bạn."}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tabCards.map((card) => (
          <form key={card.title} action={requestReadingAction} className="unlock-card">
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
                {TEMPORARY_FULL_ACCESS ? "Miễn phí" : "Cần xu"}
              </span>
              <button className="btn btn-primary btn-small" type="submit">
                Xem ngay
              </button>
            </div>
            <p className="mt-3 text-xs text-stone-400">Áp dụng cho lá số {chart.input.fullName}</p>
          </form>
        ))}
      </div>
    </section>
  );
}
