import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ getDb: mocks.getDb }));

function createDb() {
  const db = {
    user: { count: vi.fn(async () => 1) },
    chart: { count: vi.fn(async () => 2) },
    reading: { count: vi.fn(async () => 3) },
    article: {
      count: vi.fn(async () => 4),
      findMany: vi.fn(async () => []),
    },
    pseoPage: { count: vi.fn(async () => 0) },
    paymentOrder: { count: vi.fn(async () => 5) },
    coinPackage: { findMany: vi.fn(async () => []) },
    featurePrice: {
      upsert: vi.fn(async ({ create }: { create: { key: string; label: string; priceCoins: number; isActive: boolean } }) => create),
      findUnique: vi.fn(async ({ where }: { where: { key: string } }) =>
        where.key === "PALACE" ? { key: "PALACE", label: "Luận cung", priceCoins: 15, isActive: true } : null,
      ),
      findMany: vi.fn(async () => [{ key: "PALACE", label: "Luận cung", priceCoins: 15, isActive: true }]),
    },
    $transaction: vi.fn(async (items: Array<Promise<unknown>>) => Promise.all(items)),
  };
  return db;
}

describe("admin feature pricing", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.getDb.mockReset();
  });

  it("upserts edited feature prices into the FeaturePrice table", async () => {
    const db = createDb();
    mocks.getDb.mockReturnValue(db);

    const { updateFeaturePrices } = await import("@/lib/data");
    await updateFeaturePrices([
      { key: "PALACE", priceCoins: 15 },
      { key: "FULL", priceCoins: 179 },
    ]);

    expect(db.featurePrice.upsert).toHaveBeenCalledWith({
      where: { key: "PALACE" },
      update: { label: "Luận cung", priceCoins: 15, isActive: true },
      create: { key: "PALACE", label: "Luận cung", priceCoins: 15, isActive: true },
    });
    expect(db.featurePrice.upsert).toHaveBeenCalledWith({
      where: { key: "FULL" },
      update: { label: "Luận giải toàn bộ", priceCoins: 179, isActive: true },
      create: { key: "FULL", label: "Luận giải toàn bộ", priceCoins: 179, isActive: true },
    });
  });

  it("uses edited prices when reading a feature price and admin overview", async () => {
    const db = createDb();
    mocks.getDb.mockReturnValue(db);

    const { getFeaturePrice, getAdminOverview } = await import("@/lib/data");

    await expect(getFeaturePrice("PALACE")).resolves.toMatchObject({ label: "Luận cung", priceCoins: 15 });
    const overview = await getAdminOverview();

    expect(overview.featurePrices.PALACE.priceCoins).toBe(15);
    expect(overview.featurePrices.FULL.priceCoins).toBe(199);
  });

  it("rejects invalid or unknown feature prices before persistence", async () => {
    const db = createDb();
    mocks.getDb.mockReturnValue(db);

    const { updateFeaturePrices } = await import("@/lib/data");

    await expect(updateFeaturePrices([{ key: "PALACE", priceCoins: -1 }])).rejects.toThrow("INVALID_PRICE");
    await expect(updateFeaturePrices([{ key: "BAD_KEY", priceCoins: 10 }])).rejects.toThrow("INVALID_PRICE_KEY");
    expect(db.featurePrice.upsert).not.toHaveBeenCalled();
  });
});
