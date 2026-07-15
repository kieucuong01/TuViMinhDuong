import Link from "next/link";
import { CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import { premiumReadingModalId } from "@/components/premium-reading-target";
import type { ReportOutlineItem } from "@/lib/chart-evidence";

function cashLabel(priceCoins: number) {
  return `${new Intl.NumberFormat("vi-VN").format(priceCoins * 1000)}đ`;
}

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
      {...(!unlocked ? { "data-ad-view": "full_offer_viewed" } : {})}
    >
      <div className="personal-report-outline-heading">
        <div>
          <p className="eyebrow">{unlocked ? "Bản FULL đã mở" : "Một lựa chọn duy nhất để đọc sâu"}</p>
          <h2 id="personal-report-outline-title">Bản FULL 9 chương cá nhân hóa</h2>
          <p>Luận giải nối trực tiếp bốn insight miễn phí với các cung, sao, đại vận và vận năm trong chính lá số này.</p>
        </div>
        <span className="personal-report-outline-badge">
          <Sparkles size={16} aria-hidden="true" />
          {items.length} chương
        </span>
      </div>

      <details className="personal-report-outline-details" open={unlocked}>
        <summary>Xem danh sách {items.length} chương</summary>
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
      </details>

      {unlocked ? (
        <Link className="btn btn-primary personal-report-outline-cta" href={`/la-so/${chartId}/nang-cao`}>
          Đọc lại bản FULL
        </Link>
      ) : (
        <div className="personal-report-outline-offer">
          <ul>
            <li>Đọc lại không mất thêm phí</li>
            <li>Tặng 3 câu hỏi với Cố vấn AI</li>
            <li><strong>{cashLabel(priceCoins)} ({priceCoins} xu)</strong></li>
          </ul>
          <button
            type="button"
            className="btn btn-primary personal-report-outline-cta"
            popoverTarget={premiumReadingModalId(chartId)}
            data-ad-click="full_offer_clicked"
            data-chart-id={chartId}
          >
            Mở lựa chọn thanh toán
          </button>
        </div>
      )}
    </section>
  );
}
