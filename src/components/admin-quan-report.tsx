import Link from "next/link";
import { readQuanReport } from "@/lib/tu-vi-quan-report";
import { readQuanGrowth } from "@/lib/tu-vi-quan-growth";
import { QUAN_STEPS, type QuanStep } from "@/lib/tu-vi-quan-measurement";

const number = new Intl.NumberFormat("vi-VN");
const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const percent = new Intl.NumberFormat("vi-VN", { style: "percent", maximumFractionDigits: 1 });
const rate = (value: number, base: number) => base ? percent.format(value / base) : "—";
const sourceNames: Record<string, string> = { direct: "Trực tiếp / chưa gắn nguồn", organic_search: "Tìm kiếm tự nhiên", ads: "Quảng cáo", ai: "Trợ lý AI", internal: "Từ trang khác của website", referral: "Liên kết bên ngoài", unknown: "Chưa xác định" };
const channelNames: Record<string, string> = { facebook: "Facebook", tiktok: "TikTok", zalo: "Zalo", youtube: "YouTube", shared_card: "Thiệp chia sẻ" };
const featureNames: Record<string, string> = { daily: "Gieo quẻ ngày", ritual: "Làm nghi thức", wish: "Gửi điều ước", divination: "Tarot / Kinh Dịch", share_created: "Tạo thiệp", share_image: "Chia sẻ ảnh", profile_saved: "Lưu hồ sơ sinh" };
const stepGroups: { title: string; steps: QuanStep[] }[] = [
  { title: "Tìm chỗ gặp Thầy", steps: ["teacher_click", "queue_wait", "queue_leave", "seat_ready", "start_click", "start_error"] },
  { title: "Lập lá số và trò chuyện", steps: ["birth_view", "birth_submit", "birth_ready", "birth_error", "question_send", "answer_ready", "question_error", "mic_error"] },
  { title: "Mua thêm phút", steps: ["checkout_15", "checkout_30", "checkout_ready", "checkout_error", "payment_link"] },
];

export async function AdminQuanReport({ days }: { days: 7 | 28 }) {
  const [report, growth] = await Promise.all([readQuanReport(days), readQuanGrowth(days)]);
  const totals = report?.totals;
  const journey = growth?.traffic.find(row => row.source === null && row.device === null && row.day === null);
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
          <p>Theo dõi nguồn khách, hành vi trong quán và thanh toán. Ngày tính theo giờ Việt Nam, gồm hôm nay.</p>
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
        {growth && journey && <section className="mt-4" aria-labelledby="quan-journey-title">
          <h3 id="quan-journey-title">Từ mở quán đến thanh toán</h3>
          <p className="mb-3 text-sm">Mỗi tab trình duyệt được tính tối đa một lượt mỗi ngày. Tương tác, gặp Thầy và tạo đơn là các hành vi có thể xảy ra độc lập sau khi vào sân.</p>
          <div className="admin-report-metrics">
            {([
              ["Mở trang quán", journey.opened, "Kể cả khách chưa nhập bí danh"],
              ["Vào sân", journey.entered, `${rate(journey.entered, journey.opened)} lượt mở vào sân`],
              ["Có tương tác", journey.engaged, `${rate(journey.engaged, journey.entered)} lượt vào sân`],
              ["Bắt đầu gặp Thầy", journey.started, `${rate(journey.started, journey.entered)} lượt vào sân`],
              ["Tạo đơn PayOS", journey.checkout, `${rate(journey.checkout, journey.entered)} lượt vào sân`],
              ["Thanh toán xác nhận", journey.paid, `${rate(journey.paid, journey.checkout)} lượt có đơn`],
            ] as const).map(([label, value, note]) => <article key={label} className="admin-report-metric">
              <span className="admin-report-metric-label">{label}</span><strong>{number.format(value)}</strong><small>{note}</small>
            </article>)}
          </div>
          {!journey.opened && <p className="mt-2">Chưa có lượt mở trang được ghi nhận trong kỳ. Dữ liệu này bắt đầu từ khi phát hành tính năng đo lường.</p>}
          <section className="my-4" aria-labelledby="quan-steps-title">
            <h3 id="quan-steps-title">Chi tiết từng thao tác</h3>
            <p className="text-sm">Mỗi tab được tính một lần mỗi ngày cho từng thao tác. Một lượt có thể vừa gặp lỗi vừa làm thành công sau khi thử lại. Khách quét QR từ điện thoại khác có thể thanh toán mà không bấm mở PayOS.</p>
            {growth.steps.length ? <div className="mt-3 grid gap-4 lg:grid-cols-3">
              {stepGroups.map(group => <section key={group.title} className="rounded border p-3" aria-label={group.title}>
                <h4>{group.title}</h4>
                <dl>{group.steps.map(step => <div key={step} className="flex justify-between gap-3 border-b py-2">
                  <dt>{QUAN_STEPS[step]}</dt>
                  <dd className="tabular-nums">{number.format(growth.steps.find(row => row.step === step)?.visits ?? 0)}</dd>
                </div>)}</dl>
              </section>)}
            </div> : <p>Chưa có thao tác chi tiết được ghi nhận trong kỳ.</p>}
          </section>
          <details className="my-4">
            <summary className="cursor-pointer">Nguồn truy cập và thiết bị</summary>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm [&_td]:p-2 [&_th]:p-2">
                <thead><tr><th scope="col">Nhóm</th><th scope="col">Mở</th><th scope="col">Vào sân</th><th scope="col">Gặp Thầy</th><th scope="col">Tạo đơn</th><th scope="col">Đã trả</th></tr></thead>
                <tbody>{growth.traffic.filter(row => row.source !== null || row.device !== null).map(row => {
                  const label = row.device !== null
                    ? row.device === "mobile" ? "Màn hình cảm ứng" : row.device === "desktop" ? "Chuột / bàn phím" : "Thiết bị chưa rõ"
                    : [channelNames[row.channel ?? ""], sourceNames[row.source ?? "unknown"]].filter(Boolean).join(" · ");
                  return <tr key={`${row.source}:${row.channel}:${row.device}`} className="border-t">
                    <th scope="row">{label}</th><td>{number.format(row.opened)}</td><td>{number.format(row.entered)} · {rate(row.entered, row.opened)}</td>
                    <td>{number.format(row.started)}</td><td>{number.format(row.checkout)}</td><td>{number.format(row.paid)}</td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
          </details>
          <div className="my-4 grid gap-4 md:grid-cols-2">
            <section aria-label="Tỷ lệ quay lại">
              <h3>Khách quay lại</h3>
              <p className="text-sm">Khách vào sân lần đầu trong 60 ngày, chỉ tính nhóm đã qua đủ thời gian quan sát.</p>
              <dl>{growth.retention.map(row => <div key={row.days} className="flex justify-between gap-3 border-b py-2">
                <dt>Quay lại đúng ngày {row.days}</dt><dd>{rate(row.returned, row.eligible)} · {number.format(row.returned)}/{number.format(row.eligible)}</dd>
              </div>)}</dl>
            </section>
            <section aria-label="Mức dùng tính năng">
              <h3>Khách dùng tính năng</h3>
              <p className="text-sm">Mỗi hồ sơ được tính một lần cho từng hoạt động trong kỳ.</p>
              {growth.features.length ? <dl>{growth.features.map(row => <div key={row.name} className="flex justify-between gap-3 border-b py-2">
                <dt>{featureNames[row.name] ?? row.name}</dt><dd>{number.format(row.people)}</dd>
              </div>)}</dl> : <p>Chưa có hoạt động trong kỳ.</p>}
            </section>
          </div>
        </section>}
        <h3>Số liệu vận hành trong kỳ</h3>
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
              <thead><tr><th scope="col">Ngày</th><th scope="col">Lượt mở đo được</th><th scope="col">Khách vào</th><th scope="col">Tương tác</th><th scope="col">Phiên xem</th><th scope="col">Đơn đã trả</th></tr></thead>
              <tbody>{report.daily.map((row) => (
                <tr key={row.day} className="border-t">
                  <th scope="row" className="whitespace-nowrap">{row.day.slice(8)}/{row.day.slice(5, 7)}</th>
                  <td>{number.format(growth?.traffic.find(item => item.day === row.day)?.opened ?? 0)}</td>
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
