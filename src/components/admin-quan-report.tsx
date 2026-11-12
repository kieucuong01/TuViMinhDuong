import Link from "next/link";
import { readQuanReport } from "@/lib/tu-vi-quan-report";

const number = new Intl.NumberFormat("vi-VN");
const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const percent = new Intl.NumberFormat("vi-VN", { style: "percent", maximumFractionDigits: 1 });

export async function AdminQuanReport({ days }: { days: 7 | 28 }) {
  const report = await readQuanReport(days);
  const totals = report?.totals;
  const cards = totals ? [
    ["Khách vào sân", number.format(totals.visitors), "Đếm mỗi hồ sơ khách một lần trong kỳ"],
    ["Khách có tương tác", number.format(totals.activeVisitors), "Gieo quẻ, làm nghi thức, gửi điều ước, chia sẻ hoặc bắt đầu phiên"],
    ["Phiên gặp Thầy", number.format(totals.freeSessions + totals.paidSessions), `${number.format(totals.freeSessions)} miễn phí · ${number.format(totals.paidSessions)} trả phí`],
    ["Tỷ lệ thanh toán", totals.orders ? percent.format(totals.convertedOrders / totals.orders) : "—", `${number.format(totals.convertedOrders)} / ${number.format(totals.orders)} đơn tạo trong kỳ đã thanh toán`],
    ["Tiền PayOS đã thu", currency.format(totals.revenue), `${number.format(totals.paidOrders)} đơn trả tiền trong kỳ · trước hoàn tiền`],
  ] : [];

  return (
    <section className="panel admin-revenue-panel" aria-labelledby="quan-report-title">
      <div className="admin-panel-head">
        <div>
          <h2 id="quan-report-title">Hiệu quả Tử Vi Quán 3D</h2>
          <p>Khách đã vào sân bằng bí danh và các phiên xem. Ngày tính theo giờ Việt Nam, gồm hôm nay.</p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Khoảng thời gian thống kê">
          {([7, 28] as const).map((window) => (
            <Link key={window} href={`/admin?tab=overview&quan=${window}`} prefetch={false}
              aria-current={days === window ? "true" : undefined}
              className={`btn ${days === window ? "btn-primary" : "btn-ghost"}`}>
              {window} ngày
            </Link>
          ))}
        </nav>
      </div>
      {!totals ? <p>Chưa kết nối được dữ liệu thống kê.</p> : <>
        <div className="admin-report-metrics">
          {cards.map(([label, value, note]) => (
            <article key={label} className="admin-report-metric">
              <span className="admin-report-metric-label">{label}</span>
              <strong>{value}</strong>
              <small>{note}</small>
            </article>
          ))}
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer">Xem số liệu theo ngày</summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-sm [&_td]:p-2 [&_th]:p-2">
              <thead><tr><th scope="col">Ngày</th><th scope="col">Khách vào</th><th scope="col">Tương tác</th><th scope="col">Phiên xem</th><th scope="col">Đơn đã trả</th></tr></thead>
              <tbody>{report.daily.map((row) => (
                <tr key={row.day} className="border-t">
                  <th scope="row" className="whitespace-nowrap">{row.day.slice(8)}/{row.day.slice(5, 7)}</th>
                  <td>{number.format(row.visitors ?? 0)}</td>
                  <td>{number.format(row.activeVisitors ?? 0)}</td>
                  <td>{number.format((row.freeSessions ?? 0) + (row.paidSessions ?? 0))}</td>
                  <td>{number.format(row.paidOrders ?? 0)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </details>
      </>}
    </section>
  );
}
