import Link from "next/link";
import { ArrowRight, BookOpenText, BookmarkPlus } from "lucide-react";
import { loginModalHref } from "@/components/login-modal-link";
import { premiumReadingModalId } from "@/components/premium-reading-target";

type ChartRetentionPanelProps = {
  chartId: string;
  isSignedIn: boolean;
  canCheckoutFull: boolean;
  hasAdvancedReading: boolean;
  advancedReadingId?: string;
};

export function ChartRetentionPanel({
  chartId,
  isSignedIn,
  canCheckoutFull,
  hasAdvancedReading,
  advancedReadingId,
}: ChartRetentionPanelProps) {
  const chartPath = `/la-so/${chartId}`;

  if (!isSignedIn) {
    return (
      <section className="chart-retention-panel" aria-labelledby="chart-retention-title" data-testid="chart-retention-panel">
        <div className="chart-retention-copy">
          <BookmarkPlus aria-hidden="true" size={22} />
          <div>
            <p className="eyebrow">Đọc lại bất cứ lúc nào</p>
            <h2 id="chart-retention-title">Giữ lại lá số này để xem tiếp khi cần</h2>
            <p>Đăng nhập để lá số vừa lập không bị lạc mất; lần sau bạn có thể mở lại đúng kết quả này mà không cần nhập lại thông tin.</p>
          </div>
        </div>
        <Link
          href={loginModalHref(chartPath, undefined, chartPath)}
          className="btn btn-primary chart-retention-action"
          data-ad-click="login_gate_clicked"
          prefetch={false}
        >
          Đăng nhập để lưu lá số <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </section>
    );
  }

  if (hasAdvancedReading && advancedReadingId) {
    return (
      <section className="chart-retention-panel" aria-labelledby="chart-retention-title" data-testid="chart-retention-panel">
        <div className="chart-retention-copy">
          <BookOpenText aria-hidden="true" size={22} />
          <div>
            <p className="eyebrow">Bản luận giải của bạn</p>
            <h2 id="chart-retention-title">Tiếp tục đọc bản luận giải</h2>
            <p>Bản chuyên sâu đã sẵn sàng. Bạn có thể quay lại đúng phần đang quan tâm và đọc tiếp theo từng chương.</p>
          </div>
        </div>
        <Link
          href={`${chartPath}/nang-cao?reading=${encodeURIComponent(advancedReadingId)}`}
          className="btn btn-primary chart-retention-action"
          data-ad-click="reading_resume_clicked"
          prefetch={false}
        >
          Tiếp tục đọc <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </section>
    );
  }

  if (canCheckoutFull) {
    return (
      <section className="chart-retention-panel" aria-labelledby="chart-retention-title" data-testid="chart-retention-panel">
        <div className="chart-retention-copy">
          <BookOpenText aria-hidden="true" size={22} />
          <div>
            <p className="eyebrow">Khi bạn muốn đi sâu hơn</p>
            <h2 id="chart-retention-title">Mở bản luận giải chuyên sâu</h2>
            <p>Đi tiếp từ phần tổng quan vừa đọc sang một bản luận giải có cấu trúc, bám theo chính lá số này và dễ tra cứu lại về sau.</p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary chart-retention-action"
          popoverTarget={premiumReadingModalId(chartId)}
          data-ad-click="full_offer_clicked"
        >
          Xem nội dung bản chuyên sâu <ArrowRight aria-hidden="true" size={18} />
        </button>
      </section>
    );
  }

  return (
    <section className="chart-retention-panel" aria-labelledby="chart-retention-title" data-testid="chart-retention-panel">
      <div className="chart-retention-copy">
        <BookmarkPlus aria-hidden="true" size={22} />
        <div>
          <p className="eyebrow">Lá số đã được lưu</p>
          <h2 id="chart-retention-title">Quay lại danh sách lá số của bạn</h2>
          <p>Mở kho lá số để xem lại kết quả đã lưu hoặc tiếp tục với một lá số khác trong tài khoản.</p>
        </div>
      </div>
      <Link href="/la-so" className="btn btn-primary chart-retention-action" prefetch={false}>
        Xem lá số đã lưu <ArrowRight aria-hidden="true" size={18} />
      </Link>
    </section>
  );
}
