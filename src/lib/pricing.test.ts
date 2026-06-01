import { describe, expect, it } from "vitest";
import { FEATURE_PRICES } from "@/lib/pricing";
import { readingBundleItemPrice } from "@/lib/reading-bundles";

describe("reading feature pricing", () => {
  it("keeps paid reading prices about 30 percent lower than the original launch prices", () => {
    expect(FEATURE_PRICES).toMatchObject({
      FULL: { priceCoins: 139 },
      PALACE: { priceCoins: 20 },
      DAI_VAN: { priceCoins: 34 },
      TIEU_VAN: { priceCoins: 27 },
      NGUYET_VAN: { priceCoins: 13 },
      NHAT_VAN: { priceCoins: 6 },
    });
  });

  it("prices a one-time group purchase at half of the remaining individual total", () => {
    expect(readingBundleItemPrice(FEATURE_PRICES.PALACE.priceCoins, 12)).toBe(120);
    expect(readingBundleItemPrice(FEATURE_PRICES.DAI_VAN.priceCoins, 10)).toBe(170);
    expect(readingBundleItemPrice(FEATURE_PRICES.TIEU_VAN.priceCoins, 8)).toBe(108);
    expect(readingBundleItemPrice(FEATURE_PRICES.NGUYET_VAN.priceCoins, 12)).toBe(78);
  });
});
