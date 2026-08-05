import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminPaymentHygienePanel } from "@/components/admin-payment-hygiene-panel";

describe("AdminPaymentHygienePanel", () => {
  it("explains pending age and reconciliation outcomes in plain language", () => {
    const html = renderToStaticMarkup(<AdminPaymentHygienePanel paymentHygiene={{
      ageBuckets: [
        { key: "under_24h", label: "Dưới 24 giờ", count: 2, amountVnd: 100_000 },
        { key: "24_to_72h", label: "24-72 giờ", count: 1, amountVnd: 200_000 },
        { key: "over_72h", label: "Trên 72 giờ", count: 3, amountVnd: 300_000 },
      ],
      latestRun: {
        scanned: 7,
        updated: 3,
        unchanged: 2,
        paidObserved: 1,
        mismatches: 1,
        providerErrors: 0,
        concurrentChanges: 0,
        finishedAt: new Date("2026-08-05T12:00:00.000Z"),
      },
    }} />);

    expect(html).toContain("Tuổi đơn đang chờ");
    expect(html).toContain("Trên 72 giờ");
    expect(html).toContain("Đã làm sạch: 3");
    expect(html).toContain("không tự coi một đơn là đã thanh toán");
  });
});
