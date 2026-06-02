import Link from "next/link";
import { BellRing, CalendarDays, History, LogIn } from "lucide-react";
import { loginModalHref } from "@/components/login-modal-link";
import type { TuViChart } from "@/lib/chart";
import { toInputDate } from "@/lib/date-fortune";

type ChartRetentionPanelProps = {
  chartId: string;
  chart: TuViChart;
  isSignedIn: boolean;
};

export function ChartRetentionPanel({ chartId, chart, isSignedIn }: ChartRetentionPanelProps) {
  const chartPath = `/la-so/${chartId}`;
  const birthYear = chart.solar.year.toString();
  const today = toInputDate(new Date());
  const dateParams = new URLSearchParams({ date: today, birthYear });
  const saveHref = isSignedIn ? "/la-so" : loginModalHref(chartPath, undefined, chartPath);

  return (
    <section className="chart-retention-panel" aria-label="Nhắc quay lại với lá số này" data-testid="chart-retention-panel">
      <div className="chart-retention-head">
        <span>
          <BellRing size={18} />
          Giữ nhịp xem lá số
        </span>
        <p>Lưu lại, quay về khi sang tháng mới và dùng chính năm sinh này để xem ngày theo tuổi.</p>
      </div>

      <div className="chart-retention-grid">
        <Link href={saveHref} className="chart-retention-card">
          {isSignedIn ? <History size={19} /> : <LogIn size={19} />}
          <strong>{isSignedIn ? "Xem lá số đã lưu" : "Đăng nhập để lưu lá số"}</strong>
          <span>{isSignedIn ? "Mở danh sách lá số và nội dung đã từng xem." : "Lưu đường dẫn này vào tài khoản để quay lại đúng lá số."}</span>
        </Link>

        <Link href={`${chartPath}?view=nguyet-van`} className="chart-retention-card">
          <CalendarDays size={19} />
          <strong>Quay lại xem Nguyệt vận</strong>
          <span>Đầu tháng mới, mở mục này để đọc trọng tâm tháng theo lá số.</span>
        </Link>

        <Link href={`/xem-ngay?${dateParams.toString()}`} className="chart-retention-card">
          <CalendarDays size={19} />
          <strong>Xem ngày theo tuổi</strong>
          <span>Tự điền năm sinh {birthYear} để chọn ngày hợp việc và hợp tuổi hơn.</span>
        </Link>
      </div>
    </section>
  );
}
