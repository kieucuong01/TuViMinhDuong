import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PremiumReadingCta } from "@/components/premium-reading-cta";

const cssSource = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");
const ctaSource = readFileSync(fileURLToPath(new URL("./premium-reading-cta.tsx", import.meta.url)), "utf8");

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
        requiresCheckoutEmail: false,
      }),
    );

    expect(html.match(/data-ad-event="begin_checkout"/g)).toHaveLength(2);
    expect(html).toContain('data-ad-method="payos"');
    expect(html).toContain('data-ad-method="coins"');
    expect(html.match(/data-chart-id="chart-1"/g)).toHaveLength(2);
    expect(html).toContain("Thanh toán PayOS");
    expect(html).toContain("Dùng 199 xu hiện có");
    expect(html).not.toContain('name="email"');
  });

  it("keeps the coin method hidden when the balance is too low", () => {
    const html = renderToStaticMarkup(
      createElement(PremiumReadingCta, {
        chartId: "chart-1",
        fullName: "Nguyễn Minh Anh",
        hasAdvancedReading: false,
        fullPriceCoins: 199,
        coinBalance: 198,
        requiresCheckoutEmail: false,
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
        requiresCheckoutEmail: false,
      }),
    );

    expect(html).toBe("");
  });

  it("asks a guest for email and keeps PayOS as the only payment method", () => {
    const html = renderToStaticMarkup(
      createElement(PremiumReadingCta, {
        chartId: "chart-1",
        fullName: "Nguyen Minh Anh",
        hasAdvancedReading: false,
        fullPriceCoins: 199,
        coinBalance: 250,
        requiresCheckoutEmail: true,
      }),
    );

    expect(html).toContain('name="email"');
    expect(html).toContain('type="email"');
    expect(html).toContain("required");
    expect(html).toContain("Dùng để đối soát");
    expect(html).toContain('data-ad-method="payos"');
    expect(html).not.toContain('data-ad-method="coins"');
  });

  it("focuses the guest email or owner PayOS button when the popover opens", () => {
    expect(ctaSource).toContain('"use client"');
    expect(ctaSource).toContain("onToggle={focusCheckoutOnOpen}");
    expect(ctaSource).toContain('event.newState !== "open"');
    expect(ctaSource).toContain('[name="email"], [data-testid="premium-reading-confirm-submit"]');
    expect(ctaSource).toContain("?.focus()");
    expect(ctaSource).not.toContain("autoFocus");
  });

  it("uses non-modal popover semantics and a 44px close target", () => {
    const html = renderToStaticMarkup(
      createElement(PremiumReadingCta, {
        chartId: "chart-1",
        fullName: "Nguyen Minh Anh",
        hasAdvancedReading: false,
        fullPriceCoins: 199,
        coinBalance: 250,
        requiresCheckoutEmail: false,
      }),
    );

    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain('aria-modal="true"');
    expect(cssSource).toMatch(/\.premium-confirm-close\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/s);
  });
});
