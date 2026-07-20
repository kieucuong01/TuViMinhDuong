import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PersonalizedReportOutline } from "@/components/personalized-report-outline";

const items = Array.from({ length: 9 }, (_, index) => ({
  key: `chapter-${index + 1}`,
  title: `Chương cá nhân hóa ${index + 1}`,
  description: `Nội dung chương ${index + 1}.`,
}));

describe("personalized FULL report offer", () => {
  it("shows a guest all nine chapter names and sends login back to the offer", () => {
    const html = renderToStaticMarkup(
      createElement(PersonalizedReportOutline, {
        chartId: "chart-1",
        items,
        unlocked: false,
        priceCoins: 199,
        isSignedIn: false,
        canReadFullOverview: false,
      }),
    );

    expect(html).toContain('<section id="personal-report-outline"');
    expect(html).toContain('aria-labelledby="personal-report-outline-title"');
    expect(html).toContain("Bản FULL 9 chương cá nhân hóa");
    for (const item of items) expect(html).toContain(item.title);
    expect(html).toContain("<details");
    expect(html).toContain(" open=\"\"");
    expect(html).toContain("Đọc lại không mất thêm phí");
    expect(html).toContain("Tặng 3 câu hỏi với Cố vấn AI");
    expect(html).toContain("199.000đ (199 xu)");
    expect(html).toContain("%23personal-report-outline");
    expect(html).toContain('data-ad-click="login_gate_clicked"');
    expect(html).toContain('data-ad-view="full_offer_viewed"');
    expect(html).not.toContain('popoverTarget="premium-confirm-chart-1"');
    expect(html).not.toContain('data-ad-click="full_offer_clicked"');
  });

  it("lets only an owner open the payment modal with the approved CTA", () => {
    const html = renderToStaticMarkup(
      createElement(PersonalizedReportOutline, {
        chartId: "chart-1",
        items,
        unlocked: false,
        priceCoins: 199,
        isSignedIn: true,
        canReadFullOverview: true,
      }),
    );

    expect(html).toContain("Mở bản FULL 9 chương — 199.000đ");
    expect(html).toContain('popoverTarget="premium-confirm-chart-1"');
    expect(html).toContain('data-ad-click="full_offer_clicked"');
    expect(html).not.toContain("%23personal-report-outline");
  });

  it("gives a signed-in non-owner a safe new-chart path without checkout", () => {
    const html = renderToStaticMarkup(
      createElement(PersonalizedReportOutline, {
        chartId: "chart-1",
        items,
        unlocked: false,
        priceCoins: 199,
        isSignedIn: true,
        canReadFullOverview: false,
      }),
    );

    expect(html).toContain("Lá số này không thuộc tài khoản của bạn");
    expect(html).toContain('href="/lap-la-so"');
    expect(html).not.toContain('popoverTarget="premium-confirm-chart-1"');
    expect(html).not.toContain('data-ad-click="full_offer_clicked"');
  });

  it("turns the outline into a reread link after purchase", () => {
    const html = renderToStaticMarkup(
      createElement(PersonalizedReportOutline, {
        chartId: "chart-1",
        items,
        unlocked: true,
        priceCoins: 199,
        isSignedIn: true,
        canReadFullOverview: true,
      }),
    );

    expect(html).toContain("Bản FULL đã mở");
    expect(html).toContain('href="/la-so/chart-1/nang-cao"');
    expect(html).not.toContain("Mở lựa chọn thanh toán");
    expect(html).not.toContain("full_offer_viewed");
  });
});
