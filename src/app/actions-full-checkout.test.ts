import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(fileURLToPath(new URL("./actions.ts", import.meta.url)), "utf8");
const orchestration = readFileSync(fileURLToPath(new URL("../lib/reading-checkout.ts", import.meta.url)), "utf8");
const checkout = source.slice(
  source.indexOf("export async function checkoutFullReadingAction"),
  source.indexOf("export async function requestReadingAction"),
);
const topupCheckout = source.slice(
  source.indexOf("export async function createCheckoutAction"),
);

describe("direct FULL checkout action contract", () => {
  it("authenticates, checks chart ownership, and takes price only from the server", () => {
    expect(checkout).toContain("getCurrentUser()");
    expect(checkout).toContain("getOperationSettings()");
    expect(checkout).toContain("record.userId !== user.id");
    expect(orchestration).toContain('deps.getFeaturePrice("FULL")');
    expect(orchestration).toContain("const amountVnd = price.priceCoins * 1000");
    expect(`${checkout}\n${orchestration}`).not.toContain('formData.get("amount');
    expect(`${checkout}\n${orchestration}`).not.toContain('formData.get("price');
  });

  it("creates a zero-coin directReading order with a checkout-scoped token", () => {
    expect(orchestration).toContain("coins: 0");
    expect(orchestration).toContain("directReading:");
    expect(orchestration).toContain('type: "FULL"');
    expect(orchestration).toContain('scopeKey: "all"');
    expect(checkout).toContain('createMagicSession(user, "checkout")');
    expect(orchestration).toContain("const returnToken = await input.getReturnToken()");
    expect(orchestration).toContain("requiresCheckoutEmail && returnToken ? { token: returnToken } : {}");
  });

  it("uses PayOS return verification and creates only a pending reading in demo mode", () => {
    expect(orchestration).toContain("const returnPath = returnToken");
    expect(orchestration).toContain("? `/api/payments/payos/full-return?token=${encodeURIComponent(returnToken)}`");
    expect(orchestration).toContain(': "/api/payments/payos/full-return"');
    expect(orchestration).toContain("returnPath,");
    expect(orchestration).toContain("completePaidReadingOrder");
    expect(orchestration).toContain("createPendingReading");
    expect(orchestration).not.toContain("generateReading(record.chart");
  });

  it("reuses a verified paid entitlement before creating another checkout", () => {
    expect(orchestration).toContain("retryPaidFullReading");
    expect(orchestration.indexOf("retryPaidFullReading")).toBeLessThan(orchestration.lastIndexOf("createPayOSCustomCheckout"));
  });

  it("handles forbidden unlock results before reading their payload", () => {
    expect(source.match(/result\.status === "forbidden"/g)).toHaveLength(3);
  });

  it("blocks checkout guests from the coin top-up action", () => {
    expect(topupCheckout).toContain("isCheckoutGuestUser(user)");
    expect(topupCheckout.indexOf("isCheckoutGuestUser(user)"))
      .toBeLessThan(topupCheckout.indexOf("runCoinTopupCheckout"));
  });
});
