import Link from "next/link";
import { CircleDollarSign, UserRoundCheck, UsersRound } from "lucide-react";
import type {
  AdminFunnelBreakdownRow,
  AdminFunnelDashboard,
  AdminFunnelWindowDays,
} from "@/lib/data/contracts";

function formatInteger(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatVnd(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)} đ`;
}

function formatRate(value: number) {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value)}%`;
}

function BreakdownTable({ title, rows }: { title: string; rows: AdminFunnelBreakdownRow[] }) {
  return (
    <section className="admin-funnel-breakdown" aria-label={title}>
      <h3>{title}</h3>
      <div className="admin-table-wrap">
        <table className="admin-data-table admin-data-table-compact">
          <thead>
            <tr>
              <th>Nguồn / công cụ</th>
              <th>Người</th>
              <th>Có kết quả</th>
              <th>Tài khoản</th>
              <th>Thanh toán</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.slice(0, 8).map((row) => (
              <tr key={row.key}>
                <td><strong>{row.label}</strong></td>
                <td>{formatInteger(row.actors)}</td>
                <td>{formatInteger(row.results)}</td>
                <td>{formatInteger(row.accounts)}</td>
                <td>{formatInteger(row.paid)}</td>
              </tr>
            )) : (
              <tr><td colSpan={5}>Chưa có đủ dữ liệu trong khoảng này.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AdminFunnelPanel({
  dashboard,
  initialWindow,
}: {
  dashboard: AdminFunnelDashboard;
  initialWindow: AdminFunnelWindowDays;
}) {
  const report = dashboard.windows[initialWindow];
  const maxActors = Math.max(1, ...report.stages.map((stage) => stage.actors));
  const totalActors = report.identifiedActors + report.anonymousActors;

  return (
    <section className="admin-funnel-panel" aria-labelledby="admin-funnel-title" data-testid="admin-funnel-panel">
      <div className="admin-funnel-head">
        <div>
          <p className="eyebrow">Funnel riêng tư</p>
          <h2 id="admin-funnel-title">Hành trình từ lượt xem đến luận giải</h2>
          <p>Mỗi người chỉ được tính một lần ở từng bước; tỷ lệ được so với bước ngay trước đó.</p>
        </div>
        <nav className="admin-funnel-window-tabs" aria-label="Chọn khoảng thời gian funnel">
          {[7, 28].map((days) => (
            <Link
              key={days}
              href={`/admin?tab=overview&funnel=${days}`}
              className={days === initialWindow ? "active" : ""}
              aria-current={days === initialWindow ? "page" : undefined}
              prefetch={false}
            >
              {days} ngày
            </Link>
          ))}
        </nav>
      </div>

      <div className="admin-funnel-health" aria-label="Chất lượng dữ liệu và đơn cần xử lý">
        <article>
          <UsersRound aria-hidden="true" size={20} />
          <span>Tổng người / phiên</span>
          <strong>{formatInteger(totalActors)}</strong>
        </article>
        <article>
          <UserRoundCheck aria-hidden="true" size={20} />
          <span>Đã nhận diện</span>
          <strong>{formatInteger(report.identifiedActors)}</strong>
          <small>{formatRate(totalActors ? (report.identifiedActors / totalActors) * 100 : 0)} tổng hành trình</small>
        </article>
        <article className={dashboard.stalePendingOrders ? "warning" : ""}>
          <CircleDollarSign aria-hidden="true" size={20} />
          <span>Đơn chờ quá 24 giờ</span>
          <strong>{formatInteger(dashboard.stalePendingOrders)}</strong>
          <small>{formatVnd(dashboard.stalePendingAmountVnd)} cần đối soát</small>
        </article>
      </div>

      <ol className="admin-funnel-stages" aria-label={`Funnel ${initialWindow} ngày`}>
        {report.stages.map((stage) => {
          const change = stage.conversionRate - stage.previousConversionRate;
          return (
            <li key={stage.name}>
              <div className="admin-funnel-stage-copy">
                <strong>{stage.label}</strong>
                <span>{formatInteger(stage.actors)} người</span>
              </div>
              <div className="admin-funnel-bar" aria-hidden="true">
                <span style={{ width: `${Math.max(stage.actors ? 4 : 0, (stage.actors / maxActors) * 100)}%` }} />
              </div>
              <div className="admin-funnel-rate">
                <strong>{formatRate(stage.conversionRate)}</strong>
                <small>{change === 0 ? "bằng kỳ trước" : `${change > 0 ? "+" : ""}${formatRate(change)} so với kỳ trước`}</small>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="admin-funnel-breakdown-grid">
        <BreakdownTable title="Theo nguồn truy cập" rows={report.sourceBreakdown} />
        <BreakdownTable title="Theo công cụ" rows={report.toolBreakdown} />
      </div>
      <p className="admin-funnel-privacy-note">
        Báo cáo chỉ giữ nhóm nguồn, công cụ và trạng thái chuyển đổi; không hiển thị nội dung lá số, ngày sinh hay mã phiên truy cập.
      </p>
    </section>
  );
}
