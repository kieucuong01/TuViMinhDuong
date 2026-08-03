import { describe, expect, it } from "vitest";

import {
  buildAgentPricingResource,
  buildAgentSiteResource,
} from "@/lib/agent-resources";
import { APP_URL } from "@/lib/env";
import { COIN_PACKAGES, FEATURE_PRICES } from "@/lib/pricing";

describe("public agent resources", () => {
  it("describes the public site without private or write-capable fields", () => {
    const resource = buildAgentSiteResource();

    expect(resource).toMatchObject({
      schemaVersion: "1.0",
      language: "vi-VN",
      site: { name: "Lá số tinh hoa", url: APP_URL },
      discovery: {
        llms: expect.stringMatching(/\/llms\.txt$/),
        sitemap: expect.stringMatching(/\/sitemap\.xml$/),
      },
    });
    expect(JSON.stringify(resource)).not.toMatch(/secret|token|password|userId|database/i);
  });

  it("lists the canonical wealth and investment tool as a primary topic", () => {
    expect(buildAgentSiteResource().primaryTopics).toContainEqual({
      name: "Tử vi tài lộc & Đầu tư",
      url: `${APP_URL}/tu-vi-tai-loc-dau-tu`,
    });
  });

  it("derives current public pricing from supplied application data", () => {
    const resource = buildAgentPricingResource({
      featurePrices: FEATURE_PRICES,
      coinPackages: COIN_PACKAGES,
      commercialEnabled: true,
    });

    expect(resource.coin).toEqual({ unit: "xu", vndPerCoin: 1000 });
    expect(resource.readings).toContainEqual({
      key: "FULL",
      label: "Luận giải toàn bộ",
      priceCoins: 199,
    });
    expect(resource.packages).toEqual(COIN_PACKAGES);
    expect(resource.confirmationUrl).toMatch(/\/pricing$/);
  });
});
