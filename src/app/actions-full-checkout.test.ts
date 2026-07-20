import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(fileURLToPath(new URL("./actions.ts", import.meta.url)), "utf8");
const checkout = source.slice(
  source.indexOf("export async function checkoutFullReadingAction"),
  source.indexOf("export async function requestReadingAction"),
);

describe("direct FULL checkout action contract", () => {
  it("authenticates, checks chart ownership, and takes price only from the server", () => {
    expect(checkout).toContain("getCurrentUser()");
    expect(checkout).toContain("getOperationSettings()");
    expect(checkout).toContain("record.userId !== user.id");
    expect(checkout).toContain('getFeaturePrice("FULL")');
    expect(checkout).toContain("const amountVnd = price.priceCoins * 1000");
    expect(checkout).not.toContain('formData.get("amount');
    expect(checkout).not.toContain('formData.get("price');
  });

  it("creates a zero-coin directReading order without a magic token", () => {
    expect(checkout).toContain("coins: 0");
    expect(checkout).toContain("directReading:");
    expect(checkout).toContain('type: "FULL"');
    expect(checkout).toContain('scopeKey: "all"');
    expect(checkout).not.toContain("createMagicSession");
    expect(checkout).not.toContain("token,");
  });

  it("uses PayOS return verification and creates only a pending reading in demo mode", () => {
    expect(checkout).toContain('returnPath: "/api/payments/payos/full-return"');
    expect(checkout).toContain("completePaidReadingOrder");
    expect(checkout).toContain("createPendingReading");
    expect(checkout).not.toContain("generateReading(");
  });

  it("reuses a verified paid entitlement before creating another checkout", () => {
    expect(checkout).toContain("retryPaidFullReading");
    expect(checkout.indexOf("retryPaidFullReading")).toBeLessThan(checkout.indexOf("createPayOSCustomCheckout"));
  });

  it("handles forbidden unlock results before reading their payload", () => {
    expect(source.match(/result\.status === "forbidden"/g)).toHaveLength(3);
  });
});
