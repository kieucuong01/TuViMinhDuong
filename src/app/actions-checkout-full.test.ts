import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("./actions.ts", import.meta.url)),
  "utf8",
);
const orchestration = readFileSync(
  fileURLToPath(new URL("../lib/reading-checkout.ts", import.meta.url)),
  "utf8",
);

describe("FULL checkout action guest contract", () => {
  it("requires email, claims an isolated guest, and restores it on PayOS return", () => {
    expect(source).toContain('normalizeCheckoutEmail(formData.get("email"))');
    expect(source).toContain("claimGuestChartForCheckout(chartId");
    expect(source).toContain("await setSession(user)");
    expect(source).toContain("checkoutRecord = record");
    expect(source).toContain("checkoutRecord = { ...record, userId: user.id }");
    expect(source).toContain("record: checkoutRecord");
    expect(source).toContain('createMagicSession(user, "checkout")');
    expect(orchestration).toContain("/api/payments/payos/full-return?token=");
    expect(source).toContain("buyerEmail");
    expect(orchestration).toContain("checkoutEmail: buyerEmail");
  });

  it("does not route a guest through the login modal", () => {
    const checkoutSource = source.slice(
      source.indexOf("export async function checkoutFullReadingAction"),
      source.indexOf("export async function requestReadingAction"),
    );
    expect(checkoutSource).not.toContain('paywall: "login"');
  });
});
