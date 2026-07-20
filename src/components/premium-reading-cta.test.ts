import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PremiumReadingCta } from "@/components/premium-reading-cta";

vi.mock("@/app/actions", () => ({
  checkoutFullReadingAction: vi.fn(),
  requestReadingAction: vi.fn(),
}));

describe("premium reading checkout analytics", () => {
  it("tracks PayOS and coin checkout methods when the owner has enough coins", () => {
    const html = renderToStaticMarkup(
      createElement(PremiumReadingCta, {
        chartId: "chart-1",
        fullName: "Nguyễn Minh Anh",
        hasAdvancedReading: false,
        fullPriceCoins: 199,
        coinBalance: 250,
      }),
    );

    expect(html.match(/data-ad-event="begin_checkout"/g)).toHaveLength(2);
    expect(html).toContain('data-ad-method="payos"');
    expect(html).toContain('data-ad-method="coins"');
    expect(html.match(/data-chart-id="chart-1"/g)).toHaveLength(2);
    expect(html).toContain("Thanh toán PayOS");
    expect(html).toContain("Dùng 199 xu hiện có");
  });

  it("keeps the coin method hidden when the balance is too low", () => {
    const html = renderToStaticMarkup(
      createElement(PremiumReadingCta, {
        chartId: "chart-1",
        fullName: "Nguyễn Minh Anh",
        hasAdvancedReading: false,
        fullPriceCoins: 199,
        coinBalance: 198,
      }),
    );

    expect(html.match(/data-ad-event="begin_checkout"/g)).toHaveLength(1);
    expect(html).toContain('data-ad-method="payos"');
    expect(html).not.toContain('data-ad-method="coins"');
  });

  it("does not render checkout after the FULL reading is unlocked", () => {
    const html = renderToStaticMarkup(
      createElement(PremiumReadingCta, {
        chartId: "chart-1",
        fullName: "Nguyễn Minh Anh",
        hasAdvancedReading: true,
        fullPriceCoins: 199,
        coinBalance: 250,
      }),
    );

    expect(html).toBe("");
  });
});
