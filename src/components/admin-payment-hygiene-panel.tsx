import { Clock3, RefreshCw, ShieldCheck } from "lucide-react";
import type { AdminBusinessDashboard } from "@/lib/data";

function formatInteger(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatVnd(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)} đ`;
}

function formatDateTime(value: Date) {
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminPaymentHygienePanel({
  paymentHygiene,
}: {
  paymentHygiene: AdminBusinessDashboard["paymentHygiene"];
}) {
  const latest = paymentHygiene.latestRun;
  return (
    <section className="panel admin-funnel-panel" aria-labelledby="admin-payment-hygiene-title" data-testid="admin-payment-hygiene">
      <div className="admin-funnel-head">
        <div>
          <p className="eyebrow">Đối soát PayOS</p>
          <h2 id="admin-payment-hygiene-title">Tuổi đơn đang chờ và kết quả xử lý gần nhất</h2>
          <p>Đơn càng lâu càng cần được kiểm tra với PayOS; hệ thống không tự coi một đơn là đã thanh toán.</p>
        </div>
        <ShieldCheck aria-hidden="true" size={24} />
      </div>
      <div className="admin-funnel-health" aria-label="Tuổi các đơn thanh toán đang chờ">
        {paymentHygiene.ageBuckets.map((bucket, index) => (
          <article key={bucket.key} className={index === 2 && bucket.count ? "warning" : ""}>
            <Clock3 aria-hidden="true" size={20} />
            <span>{bucket.label}</span>
            <strong>{formatInteger(bucket.count)} đơn</strong>
            <small>{formatVnd(bucket.amountVnd)}</small>
          </article>
        ))}
      </div>
      {latest ? (
        <div className="admin-payment-summary" aria-label="Kết quả lần đối soát gần nhất">
          <span><RefreshCw aria-hidden="true" size={14} /> {formatDateTime(latest.finishedAt)}</span>
          <span>Đã quét: {formatInteger(latest.scanned)}</span>
          <span className="paid">Đã làm sạch: {formatInteger(latest.updated)}</span>
          <span>Không đổi: {formatInteger(latest.unchanged)}</span>
          <span>Có dấu hiệu đã trả: {formatInteger(latest.paidObserved)}</span>
          <span>Cần xem lại: {formatInteger(latest.mismatches + latest.providerErrors + latest.concurrentChanges)}</span>
        </div>
      ) : (
        <p className="admin-empty-note">Chưa có lần đối soát áp dụng nào. Lệnh vận hành mặc định chỉ chạy thử.</p>
      )}
    </section>
  );
}
