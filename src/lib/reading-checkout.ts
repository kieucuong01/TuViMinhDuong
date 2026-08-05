import "server-only";

import type { SessionUser } from "@/lib/auth";
import type { StoredChart } from "@/lib/data/contracts";
import { paymentFunnelAttribution, recordFunnelEventBestEffort } from "@/lib/funnel-events";

type FeaturePrice = { label: string; priceCoins: number };
type Database = ReturnType<typeof import("@/lib/db").getDb>;
type CoinPackage = (typeof import("@/lib/pricing").COIN_PACKAGES)[number];

export type ReadingCheckoutResult =
  | { status: "cached" | "pending" | "retrying" | "demo-paid"; location: string; revalidatePath?: string }
  | { status: "external"; location: string }
  | { status: "error"; code: "forbidden" | "email-invalid" | "unavailable" | "checkout-error" };

export type FullReadingCheckoutDeps = {
  getDb: () => Database;
  getCachedReading: typeof import("@/lib/data/readings").getCachedReading;
  getReadingJobByScope: typeof import("@/lib/data/readings").getReadingJobByScope;
  getFeaturePrice: typeof import("@/lib/data/settings").getFeaturePrice;
  retryPaidFullReading: typeof import("@/lib/payos").retryPaidFullReading;
  createPayOSCustomCheckout: typeof import("@/lib/payos").createPayOSCustomCheckout;
  createPendingReading: typeof import("@/lib/data/readings").createPendingReading;
  completePaidReadingOrder: typeof import("@/lib/payos").completePaidReadingOrder;
};

export type FullReadingCheckoutInput = {
  record: StoredChart;
  user: SessionUser;
  chartId: string;
  buyerEmail: string | null;
  requiresCheckoutEmail: boolean;
  getReturnToken: () => Promise<string | null>;
};

export type QuickReadingCheckoutDeps = {
  getDb: () => Database;
  createPayOSCustomCheckout: typeof import("@/lib/payos").createPayOSCustomCheckout;
  isPayOSEnabled: typeof import("@/lib/env").isPayOSEnabled;
  generateReading: typeof import("@/lib/ai").generateReading;
  saveReading: typeof import("@/lib/data/readings").saveReading;
};

export type QuickReadingCheckoutInput = {
  user: SessionUser;
  chart: StoredChart;
  token: string;
  price: FeaturePrice;
};

export type CoinTopupCheckoutDeps = {
  getDb: () => Database;
  createPayOSCheckout: typeof import("@/lib/payos").createPayOSCheckout;
  adjustCoins: typeof import("@/lib/data/readings").adjustCoins;
};

export type CoinTopupCheckoutInput = {
  user: SessionUser;
  packageKey: string;
  pack: CoinPackage;
  returnTo: string;
};

function isDemoCheckout(raw: unknown) {
  return Boolean(raw && typeof raw === "object" && "mode" in raw);
}

function withQueryParams(path: string, params: Record<string, string | number>) {
  const [withoutHash, hash] = path.split("#");
  const [basePath, existingQuery] = withoutHash.split("?");
  const query = new URLSearchParams(existingQuery || "");
  Object.entries(params).forEach(([key, value]) => query.set(key, String(value)));
  const qs = query.toString();
  return `${basePath}${qs ? `?${qs}` : ""}${hash ? `#${hash}` : ""}`;
}

export async function runCoinTopupCheckout(
  deps: CoinTopupCheckoutDeps,
  input: CoinTopupCheckoutInput,
) {
  const checkout = await deps.createPayOSCheckout(input.packageKey, input.user, input.returnTo);
  const db = deps.getDb();

  if (db) {
    const packageRecord = await db.coinPackage.upsert({
      where: { key: input.pack.key },
      update: {
        label: input.pack.label,
        coins: input.pack.coins,
        bonusCoins: input.pack.bonusCoins,
        priceVnd: input.pack.priceVnd,
        isActive: true,
      },
      create: {
        key: input.pack.key,
        label: input.pack.label,
        coins: input.pack.coins,
        bonusCoins: input.pack.bonusCoins,
        priceVnd: input.pack.priceVnd,
        isActive: true,
      },
    });
    const attributionSnapshot = { source: "unknown", landingClass: "pricing", tool: "coin_topup" } as const;
    const order = await db.paymentOrder.create({
      data: {
        userId: input.user.id,
        packageId: packageRecord.id,
        orderCode: BigInt(checkout.orderCode),
        paymentLinkId: checkout.paymentLinkId,
        amountVnd: checkout.amountVnd,
        coins: checkout.coins,
        checkoutUrl: checkout.checkoutUrl,
        rawPayload: checkout.raw,
        attribution: attributionSnapshot,
      },
    });
    if (order?.id) {
      await recordFunnelEventBestEffort({
        name: "checkout",
        userId: input.user.id,
        ...attributionSnapshot,
        dedupeKey: `checkout:${order.id}`,
      });
    }
  } else if (isDemoCheckout(checkout.raw)) {
    await deps.adjustCoins(input.user, checkout.coins, "Demo nạp xu", String(checkout.orderCode));
    return {
      status: "demo-paid" as const,
      location: withQueryParams(input.returnTo, { status: "demo-paid", orderCode: checkout.orderCode }),
    };
  }

  return { status: "external" as const, location: checkout.checkoutUrl };
}

export async function runQuickReadingCheckout(
  deps: QuickReadingCheckoutDeps,
  input: QuickReadingCheckoutInput,
): Promise<ReadingCheckoutResult> {
  const { chart, price, token, user } = input;
  const amountVnd = price.priceCoins * 1000;
  const successNext = `/la-so/${chart.id}/nang-cao`;
  const magicPath = `/api/auth/magic?token=${encodeURIComponent(token)}&next=${encodeURIComponent(successNext)}`;
  const cancelPath = `/la-so/${chart.id}?status=cancelled`;

  let checkout: Awaited<ReturnType<QuickReadingCheckoutDeps["createPayOSCustomCheckout"]>>;
  try {
    checkout = await deps.createPayOSCustomCheckout({
      amountVnd,
      description: "Luan giai la so",
      itemName: price.label,
      buyerName: user.name,
      buyerEmail: user.email,
      returnPath: magicPath,
      cancelPath,
    });
  } catch {
    return { status: "error", code: "checkout-error" };
  }

  const db = deps.getDb();
  const demoCheckout = isDemoCheckout(checkout.raw);
  if (db) {
    const attributionSnapshot = paymentFunnelAttribution(chart.creationAttribution);
    const order = await db.paymentOrder.create({
      data: {
        userId: user.id,
        orderCode: BigInt(checkout.orderCode),
        paymentLinkId: checkout.paymentLinkId,
        amountVnd,
        coins: 0,
        status: demoCheckout ? "PAID" : "PENDING",
        paidAt: demoCheckout ? new Date() : undefined,
        checkoutUrl: checkout.checkoutUrl,
        attribution: attributionSnapshot,
        rawPayload: {
          raw: checkout.raw,
          quickReading: {
            chartId: chart.id,
            type: "FULL",
            scopeKey: "all",
            email: user.email,
            token,
          },
        },
      },
    });
    if (order?.id) {
      await recordFunnelEventBestEffort({
        name: "checkout",
        userId: user.id,
        chartId: chart.id,
        ...attributionSnapshot,
        dedupeKey: `checkout:${order.id}`,
      });
    }
  }

  if (!deps.isPayOSEnabled()) {
    const generated = await deps.generateReading(chart.chart, "FULL", "all");
    await deps.saveReading(user, chart.id, "FULL", "all", price.priceCoins, generated.content, {
      type: "FULL",
      scopeKey: "all",
      model: generated.model,
      source: "quick-email-demo",
    });
    return {
      status: "demo-paid",
      location: `/la-so/${chart.id}/nang-cao?status=demo-paid`,
      revalidatePath: `/la-so/${chart.id}`,
    };
  }

  return { status: "external", location: checkout.checkoutUrl };
}

export async function runFullReadingCheckout(
  deps: FullReadingCheckoutDeps,
  input: FullReadingCheckoutInput,
): Promise<ReadingCheckoutResult> {
  const { record, user, chartId, buyerEmail, requiresCheckoutEmail } = input;
  if (record.userId !== user.id && user.role !== "ADMIN") return { status: "error", code: "forbidden" };
  if (!buyerEmail) return { status: "error", code: "email-invalid" };

  const [cached, pending, price] = await Promise.all([
    deps.getCachedReading(user.id, chartId, "FULL", "all"),
    deps.getReadingJobByScope(user.id, chartId, "FULL", "all"),
    deps.getFeaturePrice("FULL"),
  ]);
  if (cached) {
    return { status: "cached", location: `/la-so/${chartId}/nang-cao?reading=${cached.id}` };
  }
  if (pending?.status === "PENDING") {
    return { status: "pending", location: `/la-so/${chartId}/nang-cao?reading=${pending.id}&generating=1` };
  }

  const db = deps.getDb();
  if (db && pending?.status === "FAILED") {
    const retried = await deps.retryPaidFullReading(db, user.id, chartId, pending);
    if (retried) {
      return { status: "retrying", location: `/la-so/${chartId}/nang-cao?reading=${retried.readingId}&generating=1` };
    }
  }

  const amountVnd = price.priceCoins * 1000;
  const returnToken = await input.getReturnToken();
  const returnPath = returnToken
    ? `/api/payments/payos/full-return?token=${encodeURIComponent(returnToken)}`
    : "/api/payments/payos/full-return";
  let checkout: Awaited<ReturnType<FullReadingCheckoutDeps["createPayOSCustomCheckout"]>>;
  try {
    checkout = await deps.createPayOSCustomCheckout({
      amountVnd,
      description: "Luan giai FULL",
      itemName: price.label,
      buyerName: user.name,
      buyerEmail,
      returnPath,
      cancelPath: `/la-so/${chartId}`,
    });
  } catch {
    return { status: "error", code: "checkout-error" };
  }

  const demoCheckout = isDemoCheckout(checkout.raw);
  if (!db) {
    if (!demoCheckout) return { status: "error", code: "unavailable" };
    const reading = await deps.createPendingReading(user, chartId, "FULL", "all", 0, {
      type: "FULL",
      scopeKey: "all",
      source: "direct-full-checkout-demo",
    });
    return {
      status: "demo-paid",
      location: `/la-so/${chartId}/nang-cao?reading=${reading.id}&generating=1&status=demo-paid&orderCode=${checkout.orderCode}`,
    };
  }

  const attributionSnapshot = paymentFunnelAttribution(record.creationAttribution);
  const order = await db.paymentOrder.create({
    data: {
      userId: user.id,
      orderCode: BigInt(checkout.orderCode),
      paymentLinkId: checkout.paymentLinkId,
      amountVnd,
      coins: 0,
      status: demoCheckout ? "PAID" : "PENDING",
      paidAt: demoCheckout ? new Date() : undefined,
      checkoutUrl: checkout.checkoutUrl,
      attribution: attributionSnapshot,
      rawPayload: {
        raw: checkout.raw,
        directReading: {
          chartId,
          type: "FULL",
          scopeKey: "all",
          checkoutEmail: buyerEmail,
          ...(requiresCheckoutEmail && returnToken ? { token: returnToken } : {}),
        },
      },
    },
  });
  await recordFunnelEventBestEffort({
    name: "checkout",
    userId: user.id,
    chartId,
    ...attributionSnapshot,
    dedupeKey: `checkout:${order.id}`,
  });

  if (demoCheckout) {
    const settled = await deps.completePaidReadingOrder(db, order, checkout.raw);
    if (!settled) return { status: "error", code: "checkout-error" };
    return {
      status: "demo-paid",
      location: `/la-so/${chartId}/nang-cao?reading=${settled.readingId}&generating=1&status=demo-paid&orderCode=${checkout.orderCode}`,
    };
  }

  return { status: "external", location: checkout.checkoutUrl };
}
