"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

type Order = {
  id: string; orderCode: string; status: string; minutes: number; amountVnd: number;
  paidAt: string | null; refundAmountVnd: number | null; refundSettledAt: string | null;
};
type Cohort = { linked: boolean; visitors: number; activated: number; shared: number; referred: number; referredActivated: number; d1: number; d1Base: number; d7: number; d7Base: number; d30: number; d30Base: number };
type Ecosystem = {
  publicPosting: boolean; features: Record<string, boolean>; switches: string[]; cohorts: Cohort[];
  wishes: { id: string; text: string; status: string; profile: { blocked: boolean }; _count: { reports: number } }[];
  events: { id: string; title: string; startsAt: string; cancelled: boolean }[];
  defaultEvent: { id: string; startsAt: string } | null;
};
type Dashboard = { maxTables: number; orders: Order[]; ecosystem: Ecosystem | null };
const money = new Intl.NumberFormat("vi-VN");
const percent = (value: number, base: number) => base ? `${(value * 100 / base).toFixed(1)}% (${value}/${base})` : "Chưa đủ dữ liệu";
const dateTime = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" });
const orderStatuses: Record<string, string> = { pending: "Chờ thanh toán", paid: "Đã thanh toán", queued: "Xếp hàng", invited: "Đã mời", active: "Đang xem", ended: "Đã kết thúc", refund: "Yêu cầu hoàn tiền", cancelled: "Đã hủy" };
const isRefundDue = (order: Order) => order.status === "refund" && !order.refundSettledAt;
const switchLabels: Record<string, string> = { daily: "Quẻ ngày", ritual: "Nghi thức", tarot: "Tarot", iching: "Kinh Dịch", horoscope: "Vận trình", wish: "Điều ước mới", wish_edit: "Sửa điều ước", event_join: "Tham gia sự kiện", event_claim: "Nhận quà sự kiện", buy: "Đổi vật phẩm", share: "Tạo bản chia sẻ" };

async function fetchDashboard(body?: object) {
  const response = await fetch("/api/tu-vi-quan/admin", body ? {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  } : { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Không tải được dữ liệu quán.");
  if (body && !Array.isArray(data.orders)) return fetchDashboard();
  return data as Dashboard;
}

export default function QuanAdmin() {
  const [data, setData] = useState<Dashboard>();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("all");
  const [orderCode, setOrderCode] = useState("");

  useEffect(() => {
    let live = true;
    void fetchDashboard().then((value) => { if (live) setData(value); })
      .catch((failure) => { if (live) setError(failure.message); });
    return () => { live = false; };
  }, []);

  async function update(body?: object) {
    setPending(true);
    setError("");
    setNotice("");
    try {
      setData(await fetchDashboard(body));
      setNotice(body ? "Đã lưu thay đổi." : "Đã làm mới dữ liệu.");
    }
    catch (failure) { setError((failure as Error).message); }
    finally { setPending(false); }
  }

  const orders = data?.orders ?? [];
  const refunds = orders.filter(isRefundDue);
  const visibleOrders = orders.filter((order) =>
    order.orderCode.includes(orderCode.trim()) &&
    (filter === "all" || (filter === "refund-due" ? isRefundDue(order) : order.status === filter))
  );

  return <main className="section admin-main mx-auto max-w-7xl px-4 sm:px-6">
    <Link href="/admin?tab=overview" className="inline-flex items-center gap-2"><ArrowLeft size={16} aria-hidden /> Tổng quan quản trị</Link>
    <header className="admin-hero">
      <div>
        <h1 className="section-title">Vận hành Tử Vi Quán</h1>
        <p>Quản lý bàn thầy, đơn xem và hoạt động trong quán.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/tu-vi-quan" className="btn btn-ghost">Mở quán 3D <ExternalLink size={16} aria-hidden /></Link>
        <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => void update()}>
          <RefreshCw size={16} aria-hidden /> {pending ? "Đang cập nhật…" : "Làm mới"}
        </button>
      </div>
    </header>
    <p role="status" className="my-2">{!data && !error ? "Đang tải dữ liệu quán…" : notice}</p>
    {error && <p role="alert" className="alert my-3">{error}</p>}
    {data && <>
      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Mục vận hành">
        <a className="btn btn-ghost" href="#quan-orders">Đơn xem</a>
        {data.ecosystem && <>
          <a className="btn btn-ghost" href="#quan-wishes">Điều ước</a>
          <a className="btn btn-ghost" href="#quan-events">Lịch cầu an</a>
          <a className="btn btn-ghost" href="#quan-settings">Cấu hình</a>
        </>}
        <Link href="/admin?tab=overview" className="btn btn-ghost">Báo cáo hiệu quả</Link>
      </nav>
      <div className="admin-report-metrics mb-5">
        <article className="admin-report-metric">
          <span className="admin-report-metric-label">Bàn nhận khách</span>
          <strong>{data.maxTables} chỗ</strong>
          <small>Quán tự mời khách đang chờ khi có chỗ trống.</small>
        </article>
        <article className="admin-report-metric">
          <span className="admin-report-metric-label">Chờ đối soát hoàn tiền</span>
          <strong>{money.format(refunds.length)}</strong>
          <small>{money.format(refunds.reduce((sum, order) => sum + (order.refundAmountVnd ?? 0), 0))} đ</small>
          <a className="btn btn-ghost" href="#quan-orders" onClick={() => { setFilter("refund-due"); setOrderCode(""); }}>Xem đơn cần hoàn</a>
        </article>
        {data.ecosystem && <article className="admin-report-metric">
          <span className="admin-report-metric-label">Điều ước cần xem</span>
          <strong>{money.format(data.ecosystem.wishes.length)}{data.ecosystem.wishes.length === 60 ? "+" : ""}</strong>
          <small>{data.ecosystem.publicPosting ? "Đang cho phép đăng công khai" : "Đang tạm dừng đăng công khai"}</small>
          <a className="btn btn-ghost" href="#quan-wishes">Mở kiểm duyệt</a>
        </article>}
      </div>
      <section id="quan-orders" className="panel admin-revenue-panel mb-5 scroll-mt-4" aria-labelledby="quan-orders-title">
        <div className="admin-panel-head">
          <div>
            <h2 id="quan-orders-title">Đơn xem và hoàn tiền</h2>
            <p>Tất cả đơn chờ hoàn và tối đa 100 đơn gần đây. Giờ Việt Nam.</p>
          </div>
        </div>
        <div className="mb-3 flex flex-wrap gap-3">
          <label className="grid gap-1">Tìm mã đơn
            <input className="min-h-11 rounded border p-2" inputMode="numeric" placeholder="Nhập mã đơn" value={orderCode} onChange={(event) => setOrderCode(event.target.value)} />
          </label>
          <label className="grid gap-1">Trạng thái đơn
            <select className="min-h-11 rounded border p-2" value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">Tất cả</option><option value="refund-due">Chờ đối soát hoàn tiền</option>
              {Object.entries(orderStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
        {visibleOrders.length ? <div className="admin-table-wrap overflow-x-auto">
          <table className="admin-data-table quan-admin-orders">
            <thead><tr><th scope="col">Mã đơn</th><th scope="col">Gói</th><th scope="col">Đã thanh toán lúc</th><th scope="col">Trạng thái</th><th scope="col">Hoàn tiền</th></tr></thead>
            <tbody>{visibleOrders.map((order) => <tr key={order.id}>
              <td data-label="Mã đơn" className="tabular-nums">{order.orderCode}</td>
              <td data-label="Gói">{order.minutes} phút · {money.format(order.amountVnd)} đ</td>
              <td data-label="Đã thanh toán lúc">{order.paidAt ? dateTime.format(new Date(order.paidAt)) : "—"}</td>
              <td data-label="Trạng thái">{order.refundSettledAt ? "Đã đối soát hoàn tiền" : orderStatuses[order.status] || order.status}</td>
              <td data-label="Hoàn tiền">{order.refundAmountVnd == null ? "—" : <>{money.format(order.refundAmountVnd)} đ {isRefundDue(order) && <button type="button" className="btn btn-ghost mt-1" disabled={pending} onClick={() => {
                if (window.confirm(`Xác nhận đã chuyển ${money.format(order.refundAmountVnd!)} đ hoàn tiền cho đơn ${order.orderCode}?`)) void update({ refundOrderId: order.id });
              }}>Đánh dấu đã hoàn</button>}</>}</td>
            </tr>)}</tbody>
          </table>
        </div> : <p>{orders.length ? "Không có đơn phù hợp bộ lọc." : "Chưa có đơn xem."}</p>}
      </section>
    </>}
    {data?.ecosystem && <div className="grid gap-5">
      <details className="panel admin-revenue-panel">
        <summary className="cursor-pointer text-lg font-semibold">Khách quay lại và chia sẻ · 60 ngày</summary>
        {data.ecosystem.cohorts.length === 0 && <p>Chưa có lượt ghé.</p>}
        {data.ecosystem.cohorts.map((row) => <dl key={String(row.linked)} className="my-2 rounded border p-3">
          <dt className="font-semibold">{row.linked ? "Tài khoản liên kết" : "Khách bằng bí danh"} · {row.visitors} người</dt>
          <dd>Hoàn thành quẻ và nghi thức {percent(row.activated, row.visitors)}</dd>
          <dd>Quay lại D1 {percent(row.d1, row.d1Base)} · D7 {percent(row.d7, row.d7Base)} · D30 {percent(row.d30, row.d30Base)}</dd>
          <dd>Tạo bản chia sẻ {percent(row.shared, row.activated)} · Khách từ liên kết {row.referred} · Hoàn thành lượt đầu {percent(row.referredActivated, row.referred)}</dd>
        </dl>)}
      </details>
      <section id="quan-wishes" className="panel admin-revenue-panel scroll-mt-4" aria-label="Kiểm duyệt điều ước">
        <h2 className="text-xl font-semibold">Điều ước cần xem</h2>
        <button className="btn btn-ghost my-2" disabled={pending} onClick={() => void update({ ecosystemAction: "posting", enabled: !data.ecosystem!.publicPosting })}>{data.ecosystem.publicPosting ? "Tạm dừng đăng công khai" : "Mở đăng công khai"}</button>
        {data.ecosystem.wishes.length === 0 && <p>Chưa có nội dung cần xử lý.</p>}
        {data.ecosystem.wishes.map((wish) => <article key={wish.id} className="my-2 rounded border p-3">
          <p>{wish.text}</p><p>{wish.status === "pending" ? "Cần xem xét" : wish.status === "hidden" ? "Đã ẩn" : "Công khai"} · {wish._count.reports} báo cáo</p>
          <div className="flex flex-wrap gap-2">
            {wish.status === "pending" && <button className="btn btn-primary" disabled={pending || !data.ecosystem!.publicPosting} onClick={() => {
              if (window.confirm("Xác nhận nội dung phù hợp để đăng công khai?")) void update({ ecosystemAction: "approve", id: wish.id });
            }}>Duyệt đăng</button>}
            <button className="btn btn-ghost" disabled={pending} onClick={() => void update({ ecosystemAction: "keep_private", id: wish.id })}>Chuyển về riêng tư</button>
            {wish.status !== "hidden" && <button className="btn btn-ghost" disabled={pending} onClick={() => void update({ ecosystemAction: "hide", id: wish.id })}>Ẩn</button>}
            <button className="btn btn-danger" disabled={pending || wish.profile.blocked} onClick={() => {
              if (window.confirm("Chặn khách này đăng công khai và ẩn các điều ước công khai của họ?")) void update({ ecosystemAction: "block", id: wish.id });
            }}>Chặn đăng công khai</button>
          </div>
        </article>)}
      </section>
      <section id="quan-events" className="panel admin-revenue-panel scroll-mt-4" aria-label="Lịch cầu an">
        <h2 className="text-xl font-semibold">Lịch cầu an</h2>
        <form className="my-2 flex flex-wrap items-end gap-3" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void update({ ecosystemAction: "event", id: form.get("replace") || undefined, title: form.get("title"), startsAt: form.get("startsAt") });
        }}>
          <label>Tên buổi cầu an <input className="block rounded border p-2" name="title" maxLength={80} required defaultValue="Cùng thắp đèn cầu an" /></label>
          <label>Bắt đầu (giờ Việt Nam) <input className="block rounded border p-2" name="startsAt" type="datetime-local" required /></label>
          {data.ecosystem.defaultEvent && <label className="flex items-center gap-2"><input type="checkbox" name="replace" value={data.ecosystem.defaultEvent.id} /> Dời buổi mặc định {new Date(data.ecosystem.defaultEvent.startsAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</label>}
          <button className="btn btn-primary" disabled={pending}>Đặt lịch 15 phút</button>
        </form>
        {data.ecosystem.events.map((event) => <div key={event.id} className="my-2 flex flex-wrap items-center gap-2">
          <span>{event.title} · {dateTime.format(new Date(event.startsAt))}</span>
          {event.cancelled ? <span>Đã hủy</span> : <button className="btn btn-ghost" disabled={pending} onClick={() => {
            if (window.confirm(`Hủy buổi “${event.title}”?`)) void update({ ecosystemAction: "cancel_event", id: event.id });
          }}>Hủy buổi này</button>}
        </div>)}
      </section>
      <section id="quan-settings" className="panel admin-revenue-panel scroll-mt-4" aria-label="Bật tắt hoạt động">
        <h2 className="text-xl font-semibold">Hoạt động trong quán</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{data.ecosystem.switches.map((flag) => <label key={flag} className="flex min-h-11 items-center gap-2 rounded border px-3"><input type="checkbox" checked={data.ecosystem!.features[flag] !== false} disabled={pending} onChange={(event) => void update({ ecosystemAction: "feature", flag, enabled: event.target.checked })} />{switchLabels[flag] || flag}</label>)}</div>
      </section>
    </div>}
  </main>;
}
