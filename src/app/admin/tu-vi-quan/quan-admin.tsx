"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Order = {
  id: string; orderCode: string; status: string; minutes: number; amountVnd: number;
  paidAt: string | null; refundAmountVnd: number | null; refundSettledAt: string | null;
};
type Dashboard = { maxTables: number; orders: Order[] };
const money = new Intl.NumberFormat("vi-VN");

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
  </main>;
}
