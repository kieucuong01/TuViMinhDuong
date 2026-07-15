import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PersonalizedReportOutline } from "@/components/personalized-report-outline";

const items = [
  { key: "money", title: "Vì sao cung Tài Bạch gặp Tuần?", description: "Cách tạo và giữ tiền." },
  { key: "yearly-months", title: "Thời điểm có quý nhân trong năm 2026", description: "Mốc nên chủ động." },
];

describe("personalized FULL report offer", () => {
  it("shows one compact, trackable offer with the approved benefits and dynamic price", () => {
    const html = renderToStaticMarkup(
      createElement(PersonalizedReportOutline, {
        chartId: "chart-1",
        items,
        unlocked: false,
        priceCoins: 199,
      }),
    );

    expect(html).toContain("Bản FULL 9 chương cá nhân hóa");
    expect(html).toContain("<details");
    expect(html).toContain("Vì sao cung Tài Bạch gặp Tuần?");
    expect(html).toContain("Đọc lại không mất thêm phí");
    expect(html).toContain("Tặng 3 câu hỏi với Cố vấn AI");
    expect(html).toContain("199.000đ (199 xu)");
    expect(html).toContain('popoverTarget="premium-confirm-chart-1"');
    expect(html).toContain('data-ad-view="full_offer_viewed"');
    expect(html).toContain('data-ad-click="full_offer_clicked"');
  });

  it("turns the outline into a reread link after purchase", () => {
    const html = renderToStaticMarkup(
      createElement(PersonalizedReportOutline, {
        chartId: "chart-1",
        items,
        unlocked: true,
        priceCoins: 199,
      }),
    );

    expect(html).toContain("Bản FULL đã mở");
    expect(html).toContain('href="/la-so/chart-1/nang-cao"');
    expect(html).not.toContain("Mở lựa chọn thanh toán");
    expect(html).not.toContain("full_offer_viewed");
  });
});
