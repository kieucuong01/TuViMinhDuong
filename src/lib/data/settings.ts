import "server-only";

import { getDb } from "@/lib/db";
import { FEATURE_PRICE_KEYS, FEATURE_PRICES, type FeaturePriceMap, type ReadingKey } from "@/lib/pricing";
import { cacheServerData } from "@/lib/data/cache";
import {
  demoFeaturePrices,
  demoOperationSettings,
  replaceDemoFeaturePrices,
  replaceDemoOperationSettings,
} from "@/lib/data/demo-store";
import type { OperationSettings } from "@/lib/data/contracts";

export const OPERATION_SETTINGS_CACHE_TAG = "operation-settings";
export const FEATURE_PRICES_CACHE_TAG = "feature-prices";

export const DEFAULT_OPERATION_SETTINGS: OperationSettings = {
  paymentsEnabled: true,
  coinTopupEnabled: true,
  paidReadingsEnabled: true,
  updatedAt: null,
};

function cloneDefaultFeaturePrices(): FeaturePriceMap {
  return Object.fromEntries(
    FEATURE_PRICE_KEYS.map((key) => [key, { ...FEATURE_PRICES[key] }]),
  ) as FeaturePriceMap;
}

function normalizeFeaturePriceMap(rows: Array<{ key: string; label: string; priceCoins: number; isActive?: boolean | null }> = []): FeaturePriceMap {
  const rowMap = new Map(rows.map((row) => [row.key, row]));
  return Object.fromEntries(
    FEATURE_PRICE_KEYS.map((key) => {
      const fallback = FEATURE_PRICES[key];
      const row = rowMap.get(key);
      if (!row?.isActive) return [key, { ...fallback }];
      return [key, { label: row.label || fallback.label, priceCoins: row.priceCoins }];
    }),
  ) as FeaturePriceMap;
}

function normalizeFeaturePriceUpdates(updates: Array<{ key: string; priceCoins: number }>) {
  return updates.map((item) => {
    if (!FEATURE_PRICE_KEYS.includes(item.key as ReadingKey)) throw new Error("INVALID_PRICE_KEY");
    const key = item.key as ReadingKey;
    const priceCoins = Number(item.priceCoins);
    if (!Number.isInteger(priceCoins) || priceCoins < 0 || priceCoins > 999999) throw new Error("INVALID_PRICE");
    return { key, label: FEATURE_PRICES[key].label, priceCoins };
  });
}

function normalizeOperationSettings(row?: Partial<OperationSettings> | null): OperationSettings {
  return {
    paymentsEnabled: row?.paymentsEnabled ?? DEFAULT_OPERATION_SETTINGS.paymentsEnabled,
    coinTopupEnabled: row?.coinTopupEnabled ?? DEFAULT_OPERATION_SETTINGS.coinTopupEnabled,
    paidReadingsEnabled: row?.paidReadingsEnabled ?? DEFAULT_OPERATION_SETTINGS.paidReadingsEnabled,
    updatedAt: row?.updatedAt ?? null,
  };
}

export async function getFeaturePrice(type: ReadingKey) {
  const prices = await getFeaturePrices();
  return prices[type];
}

async function readFeaturePricesFromDb(): Promise<FeaturePriceMap> {
  const db = getDb();
  if (!db) return demoFeaturePrices(cloneDefaultFeaturePrices);
  try {
    const prices = await db.featurePrice.findMany();
    return normalizeFeaturePriceMap(prices);
  } catch {
    return cloneDefaultFeaturePrices();
  }
}

const getCachedFeaturePricesFromDb = cacheServerData(readFeaturePricesFromDb, [FEATURE_PRICES_CACHE_TAG], {
  tags: [FEATURE_PRICES_CACHE_TAG],
  revalidate: 300,
});

export async function getFeaturePrices(): Promise<FeaturePriceMap> {
  if (!getDb()) return demoFeaturePrices(cloneDefaultFeaturePrices);
  return getCachedFeaturePricesFromDb();
}

export async function updateFeaturePrices(updates: Array<{ key: string; priceCoins: number }>) {
  const normalized = normalizeFeaturePriceUpdates(updates);
  const db = getDb();

  if (!db) {
    const next = { ...demoFeaturePrices(cloneDefaultFeaturePrices) };
    for (const item of normalized) {
      next[item.key] = { label: item.label, priceCoins: item.priceCoins };
    }
    return replaceDemoFeaturePrices(next);
  }

  await db.$transaction(
    normalized.map((item) =>
      db.featurePrice.upsert({
        where: { key: item.key },
        update: { label: item.label, priceCoins: item.priceCoins, isActive: true },
        create: { key: item.key, label: item.label, priceCoins: item.priceCoins, isActive: true },
      }),
    ),
  );

  return readFeaturePricesFromDb();
}

async function readOperationSettingsFromDb(): Promise<OperationSettings> {
  const db = getDb();
  if (!db) return demoOperationSettings(DEFAULT_OPERATION_SETTINGS);

  try {
    const rows = await db.$queryRaw<
      Array<{
        paymentsEnabled: boolean;
        coinTopupEnabled: boolean;
        paidReadingsEnabled: boolean;
        updatedAt: Date | null;
      }>
    >`SELECT "paymentsEnabled", "coinTopupEnabled", "paidReadingsEnabled", "updatedAt" FROM "OperationSettings" WHERE "id" = 'global' LIMIT 1`;

    return normalizeOperationSettings(rows[0]);
  } catch {
    return DEFAULT_OPERATION_SETTINGS;
  }
}

const getCachedOperationSettingsFromDb = cacheServerData(readOperationSettingsFromDb, [OPERATION_SETTINGS_CACHE_TAG], {
  tags: [OPERATION_SETTINGS_CACHE_TAG],
  revalidate: 300,
});

export async function getOperationSettings(): Promise<OperationSettings> {
  if (!getDb()) return demoOperationSettings(DEFAULT_OPERATION_SETTINGS);
  return getCachedOperationSettingsFromDb();
}

export async function updateOperationSettings(settings: Omit<OperationSettings, "updatedAt">) {
  const next = normalizeOperationSettings(settings);
  const db = getDb();
  if (!db) {
    return replaceDemoOperationSettings({ ...next, updatedAt: new Date() });
  }

  await db.$executeRaw`
    INSERT INTO "OperationSettings" ("id", "paymentsEnabled", "coinTopupEnabled", "paidReadingsEnabled")
    VALUES ('global', ${next.paymentsEnabled}, ${next.coinTopupEnabled}, ${next.paidReadingsEnabled})
    ON CONFLICT ("id") DO UPDATE SET
      "paymentsEnabled" = EXCLUDED."paymentsEnabled",
      "coinTopupEnabled" = EXCLUDED."coinTopupEnabled",
      "paidReadingsEnabled" = EXCLUDED."paidReadingsEnabled",
      "updatedAt" = CURRENT_TIMESTAMP
  `;

  return readOperationSettingsFromDb();
}
