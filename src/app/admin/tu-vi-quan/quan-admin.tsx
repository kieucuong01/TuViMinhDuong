"use client";

import Link from "next/link";
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
  orderStats: { status: string; _count: { _all: number } }[];
};
type Dashboard = { maxTables: number; orders: Order[]; ecosystem: Ecosystem | null };
const money = new Intl.NumberFormat("vi-VN");
const percent = (value: number, base: number) => base ? `${(value * 100 / base).toFixed(1)}% (${value}/${base})` : "Chưa đủ dữ liệu";
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

  useEffect(() => {
    let live = true;
    void fetchDashboard().then((value) => { if (live) setData(value); })
      .catch((failure) => { if (live) setError(failure.message); });
    return () => { live = false; };
  }, []);

  async function update(body?: object) {
    setPending(true);
    setError("");
    try { setData(await fetchDashboard(body)); }
    catch (failure) { setError((failure as Error).message); }
    finally { setPending(false); }
  }

  return <main className="mx-auto max-w-6xl p-5">
    <Link href="/admin">← Quản trị</Link>
    <h1 className="my-4 text-3xl font-bold">Tử Vi Quán</h1>
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2">Số bàn nhận khách
        <select disabled={!data || pending} className="rounded border p-2" value={data?.maxTables ?? 3} onChange={(e) => void update({ maxTables: Number(e.target.value) })}>
          <option value={0}>Tạm dừng nhận khách</option><option value={1}>1 bàn</option><option value={2}>2 bàn</option><option value={3}>3 bàn</option>
        </select>
      </label>
      <button className="btn btn-secondary" disabled={pending} onClick={() => void update()}>Làm mới</button>
    </div>
    {error && <p role="alert" className="my-3 text-red-800">{error}</p>}
    <div className="my-4 overflow-x-auto">
      <table className="w-full min-w-[620px] text-left">
        <thead><tr><th>Mã đơn</th><th>Gói</th><th>Thanh toán</th><th>Trạng thái</th><th>Hoàn tiền</th></tr></thead>
        <tbody>{data?.orders.map((order) => <tr className="border-t" key={order.id}>
          <td className="py-3">{order.orderCode}</td><td>{order.minutes} phút · {money.format(order.amountVnd)}đ</td>
          <td>{order.paidAt ? new Date(order.paidAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "Đang chờ"}</td>
          <td>{({ pending: "Chờ trả tiền", paid: "Đã trả tiền", queued: "Xếp hàng", invited: "Đã mời", active: "Đang xem", ended: "Đã kết thúc", refund: "Cần hoàn tiền", cancelled: "Đã hủy" } as Record<string, string>)[order.status.toLowerCase()] || order.status}</td>
          <td>{order.refundAmountVnd != null && <>{money.format(order.refundAmountVnd)}đ {order.refundSettledAt ? "· Đã đối soát" : <button className="btn btn-secondary" disabled={pending} onClick={() => {
            if (window.confirm("Xác nhận khoản hoàn đã được chuyển cho khách?")) void update({ refundOrderId: order.id });
          }}>Đánh dấu đã hoàn</button>}</>}</td>
        </tr>)}</tbody>
      </table>
      {data?.orders.length === 0 && <p className="my-3">Chưa có đơn.</p>}
    </div>
    {data?.ecosystem && <div className="grid gap-6">
      <section aria-label="Thống kê hoạt động">
        <h2 className="text-xl font-semibold">Hoạt động 60 ngày</h2>
        {data.ecosystem.cohorts.length === 0 && <p>Chưa có lượt ghé.</p>}
        {data.ecosystem.cohorts.map((row) => <dl key={String(row.linked)} className="my-2 rounded border p-3">
          <dt className="font-semibold">{row.linked ? "Tài khoản liên kết" : "Khách bằng bí danh"} · {row.visitors} người</dt>
          <dd>Hoàn thành quẻ và nghi thức {percent(row.activated, row.visitors)}</dd>
          <dd>Quay lại D1 {percent(row.d1, row.d1Base)} · D7 {percent(row.d7, row.d7Base)} · D30 {percent(row.d30, row.d30Base)}</dd>
          <dd>Tạo bản chia sẻ {percent(row.shared, row.activated)} · Khách từ liên kết {row.referred} · Hoàn thành lượt đầu {percent(row.referredActivated, row.referred)}</dd>
        </dl>)}
        {data.ecosystem.orderStats.length > 0 && <p>Đơn đã tạo {data.ecosystem.orderStats.reduce((sum, item) => sum + item._count._all, 0)} · Đã thanh toán {data.ecosystem.orderStats.filter((item) => !["PENDING", "CANCELLED"].includes(item.status)).reduce((sum, item) => sum + item._count._all, 0)} · Cần đối soát hoàn tiền {data.ecosystem.orderStats.find((item) => item.status === "REFUND")?._count._all || 0}</p>}
      </section>
      <section aria-label="Kiểm duyệt điều ước">
        <h2 className="text-xl font-semibold">Điều ước cần xem</h2>
        <button className="btn btn-secondary my-2" disabled={pending} onClick={() => void update({ ecosystemAction: "posting", enabled: !data.ecosystem!.publicPosting })}>{data.ecosystem.publicPosting ? "Tạm dừng đăng công khai" : "Mở đăng công khai"}</button>
        {data.ecosystem.wishes.length === 0 && <p>Chưa có nội dung cần xử lý.</p>}
        {data.ecosystem.wishes.map((wish) => <article key={wish.id} className="my-2 rounded border p-3">
          <p>{wish.text}</p><p>{wish.status === "pending" ? "Cần xem xét" : wish.status === "hidden" ? "Đã ẩn" : "Công khai"} · {wish._count.reports} báo cáo</p>
          <div className="flex flex-wrap gap-2">
            {wish.status === "pending" && <button className="btn btn-secondary" disabled={pending || !data.ecosystem!.publicPosting} onClick={() => {
              if (window.confirm("Xác nhận nội dung phù hợp để đăng công khai?")) void update({ ecosystemAction: "approve", id: wish.id });
            }}>Duyệt đăng</button>}
            <button className="btn btn-secondary" disabled={pending} onClick={() => void update({ ecosystemAction: "keep_private", id: wish.id })}>Chuyển về riêng tư</button>
            <button className="btn btn-secondary" disabled={pending} onClick={() => void update({ ecosystemAction: "hide", id: wish.id })}>Ẩn</button>
            <button className="btn btn-secondary" disabled={pending || wish.profile.blocked} onClick={() => void update({ ecosystemAction: "block", id: wish.id })}>Chặn đăng công khai</button>
          </div>
        </article>)}
      </section>
      <section aria-label="Lịch cầu an">
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
          <span>{event.title} · {new Date(event.startsAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</span>
          {event.cancelled ? <span>Đã hủy</span> : <button className="btn btn-secondary" disabled={pending} onClick={() => void update({ ecosystemAction: "cancel_event", id: event.id })}>Hủy buổi này</button>}
        </div>)}
      </section>
      <section aria-label="Bật tắt hoạt động">
        <h2 className="text-xl font-semibold">Hoạt động trong quán</h2>
        <div className="flex flex-wrap gap-3">{data.ecosystem.switches.map((flag) => <label key={flag} className="flex items-center gap-2"><input type="checkbox" checked={data.ecosystem!.features[flag] !== false} disabled={pending} onChange={(event) => void update({ ecosystemAction: "feature", flag, enabled: event.target.checked })} />{switchLabels[flag]}</label>)}</div>
      </section>
    </div>}
  </main>;
}
