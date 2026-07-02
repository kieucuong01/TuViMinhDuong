import Link from "next/link";
import { CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import { premiumReadingModalId } from "@/components/premium-reading-target";
import type { ReportOutlineItem } from "@/lib/chart-evidence";

export function PersonalizedReportOutline({
  chartId,
  items,
  unlocked,
  priceCoins,
}: {
  chartId: string;
  items: ReportOutlineItem[];
  unlocked: boolean;
  priceCoins: number;
}) {
  return (
    <section
      className={`personal-report-outline ${unlocked ? "is-unlocked" : "is-locked"}`}
      aria-labelledby="personal-report-outline-title"
      data-chart-id={chartId}
    >
      <div className="personal-report-outline-heading">
        <div>
          <p className="eyebrow">{unlocked ? "Hồ sơ đã mở" : "Xem trước toàn bộ nội dung"}</p>
          <h2 id="personal-report-outline-title">Hồ sơ VIP của bạn gồm</h2>
          <p>
            Mỗi chương được viết từ chính dữ liệu lá số này, không phải bài mẫu dùng chung.
          </p>
        </div>
        <span className="personal-report-outline-badge">
          <Sparkles size={16} aria-hidden="true" />
          {items.length} chương cá nhân hóa
        </span>
      </div>

      <ol className="personal-report-outline-list">
        {items.map((item, index) => (
          <li className="report-outline-item" key={item.key}>
            <span className="report-outline-number">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
            {unlocked ? (
              <CheckCircle2 className="report-outline-state is-open" size={20} aria-label="Đã mở" />
            ) : (
              <LockKeyhole className="report-outline-state" size={18} aria-label="Đang khóa" />
            )}
          </li>
        ))}
      </ol>

      {unlocked ? (
        <Link className="btn btn-primary personal-report-outline-cta" href={`/la-so/${chartId}/nang-cao`}>
          Đọc Hồ sơ VIP
        </Link>
      ) : (
        <div className="personal-report-outline-offer">
          <div>
            <strong>Đọc lại không mất thêm xu</strong>
            <span>Tặng 3 câu hỏi với Cố vấn AI sau khi hồ sơ hoàn tất.</span>
          </div>
          <button
            type="button"
            className="btn btn-primary personal-report-outline-cta"
            popoverTarget={premiumReadingModalId(chartId)}
          >
            Mở hồ sơ đầy đủ — {priceCoins} xu
          </button>
        </div>
      )}
    </section>
  );
}
