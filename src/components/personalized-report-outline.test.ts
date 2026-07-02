import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PersonalizedReportOutline } from "@/components/personalized-report-outline";

const items = [
  { key: "money", title: "Vì sao cung Tài Bạch gặp Tuần?", description: "Cách tạo và giữ tiền." },
  { key: "yearly-months", title: "Thời điểm có quý nhân trong năm 2026", description: "Mốc nên chủ động." },
];

describe("personalized VIP report outline", () => {
  it("shows every personalized title and the zero-friction purchase promise", () => {
    const html = renderToStaticMarkup(
      createElement(PersonalizedReportOutline, {
        chartId: "chart-1",
        items,
        unlocked: false,
        priceCoins: 199,
      }),
    );

    expect(html).toContain("Hồ sơ VIP của bạn gồm");
    expect(html).toContain("Vì sao cung Tài Bạch gặp Tuần?");
    expect(html).toContain("Thời điểm có quý nhân trong năm 2026");
    expect(html).toContain("Mở hồ sơ đầy đủ — 199 xu");
    expect(html).toContain("Đọc lại không mất thêm xu");
    expect(html).toContain("Tặng 3 câu hỏi với Cố vấn AI");
    expect(html).toContain('popoverTarget="premium-confirm-chart-1"');
    expect(html).not.toContain('href="#mo-khoa-ho-so-vip"');
  });

  it("turns the preview into an unlocked contents list after purchase", () => {
    const html = renderToStaticMarkup(
      createElement(PersonalizedReportOutline, {
        chartId: "chart-1",
        items,
        unlocked: true,
        priceCoins: 199,
      }),
    );

    expect(html).toContain("Hồ sơ đã mở");
    expect(html).not.toContain("Mở hồ sơ đầy đủ");
    expect(html).toContain('href="/la-so/chart-1/nang-cao"');
    expect(html).not.toContain('href="#luan-giai"');
  });
});
