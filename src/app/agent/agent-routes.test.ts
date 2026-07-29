import { beforeEach, describe, expect, it, vi } from "vitest";

import { COIN_PACKAGES, FEATURE_PRICES } from "@/lib/pricing";

const mocks = vi.hoisted(() => ({
  getFeaturePrices: vi.fn(),
  getOperationSettings: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/data", () => ({
  getFeaturePrices: mocks.getFeaturePrices,
  getOperationSettings: mocks.getOperationSettings,
}));

describe("public agent routes", () => {
  beforeEach(() => {
    mocks.getFeaturePrices.mockResolvedValue(FEATURE_PRICES);
    mocks.getOperationSettings.mockResolvedValue({
      paymentsEnabled: true,
      coinTopupEnabled: true,
      paidReadingsEnabled: true,
    });
  });

  it("serves the public site resource as cacheable JSON", async () => {
    const { GET } = await import("@/app/agent/site.json/route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=86400",
    );
    expect(await response.json()).toMatchObject({ schemaVersion: "1.0", language: "vi-VN" });
  });

  it("serves current public pricing as cacheable JSON", async () => {
    const { GET } = await import("@/app/agent/pricing.json/route");
    const response = await GET();
    const resource = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=86400",
    );
    expect(resource).toMatchObject({ commercialEnabled: true, packages: COIN_PACKAGES });
  });
});
