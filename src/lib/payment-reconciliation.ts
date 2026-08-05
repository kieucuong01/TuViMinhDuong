export type StoredPaymentStatus = "PENDING" | "PAID" | "CANCELLED" | "EXPIRED" | "FAILED";
export type UnpaidTerminalPaymentStatus = "CANCELLED" | "EXPIRED" | "FAILED";

export type PendingPaymentOrder = {
  id: string;
  orderCode: bigint;
  amountVnd: number;
  status: StoredPaymentStatus;
  createdAt: Date;
  rawPayload?: unknown;
};

export type PayOSReconciliationPayment = {
  orderCode: bigint;
  amount: number;
  amountPaid: number;
  status: string;
  raw: unknown;
};

export type ReconciliationDecision =
  | { kind: "update"; status: UnpaidTerminalPaymentStatus }
  | { kind: "unchanged" }
  | { kind: "paid_observed" }
  | { kind: "mismatch" };

export type PaymentAgeBucket = {
  key: "under_24h" | "24_to_72h" | "over_72h";
  label: string;
  count: number;
  amountVnd: number;
};

export type PaymentReconciliationSummary = {
  dryRun: boolean;
  olderThanHours: number;
  scanned: number;
  updated: number;
  unchanged: number;
  cancelled: number;
  expired: number;
  failed: number;
  paidObserved: number;
  mismatches: number;
  providerErrors: number;
  concurrentChanges: number;
  startedAt: Date;
  finishedAt: Date;
};

export type PaymentReconciliationDb = {
  paymentOrder: {
    findMany(args: {
      where: { status: "PENDING"; createdAt: { lte: Date } };
      orderBy: { createdAt: "asc" };
      take: number;
      select: {
        id: true;
        orderCode: true;
        amountVnd: true;
        status: true;
        createdAt: true;
        rawPayload: true;
      };
    }): Promise<PendingPaymentOrder[]>;
    updateMany(args: {
      where: { id: string; status: "PENDING" };
      data: { status: UnpaidTerminalPaymentStatus; rawPayload: unknown };
    }): Promise<{ count: number }>;
  };
  paymentReconciliationRun: {
    create(args: { data: PaymentReconciliationSummary }): Promise<unknown>;
  };
};

type ReconcileOptions = {
  db: PaymentReconciliationDb;
  fetchPaymentRequest: (orderCode: bigint) => Promise<PayOSReconciliationPayment>;
  now?: Date;
  olderThanHours?: number;
  limit?: number;
  dryRun?: boolean;
  retries?: number;
  retryDelay?: (attempt: number) => Promise<void>;
};

const TERMINAL_UNPAID_STATUSES = new Set<UnpaidTerminalPaymentStatus>([
  "CANCELLED",
  "EXPIRED",
  "FAILED",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function boundedInteger(value: number | undefined, fallback: number, minimum: number, maximum: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.trunc(value as number)));
}

export function classifyPayOSReconciliation(
  order: PendingPaymentOrder,
  payment: PayOSReconciliationPayment,
): ReconciliationDecision {
  const status = payment.status.trim().toUpperCase();
  if (payment.orderCode !== order.orderCode || payment.amount !== order.amountVnd) {
    return { kind: "mismatch" };
  }
  if (status === "PAID") {
    return payment.amountPaid >= order.amountVnd ? { kind: "paid_observed" } : { kind: "mismatch" };
  }
  if (TERMINAL_UNPAID_STATUSES.has(status as UnpaidTerminalPaymentStatus)) {
    return { kind: "update", status: status as UnpaidTerminalPaymentStatus };
  }
  return { kind: "unchanged" };
}

export function buildPendingPaymentAgeBuckets(
  payments: PendingPaymentOrder[],
  now = new Date(),
): PaymentAgeBucket[] {
  const buckets: PaymentAgeBucket[] = [
    { key: "under_24h", label: "Dưới 24 giờ", count: 0, amountVnd: 0 },
    { key: "24_to_72h", label: "24-72 giờ", count: 0, amountVnd: 0 },
    { key: "over_72h", label: "Trên 72 giờ", count: 0, amountVnd: 0 },
  ];
  for (const payment of payments) {
    if (payment.status !== "PENDING") continue;
    const ageHours = Math.max(0, (now.getTime() - new Date(payment.createdAt).getTime()) / 3_600_000);
    const bucket = ageHours < 24 ? buckets[0] : ageHours <= 72 ? buckets[1] : buckets[2];
    bucket.count += 1;
    bucket.amountVnd += payment.amountVnd;
  }
  return buckets;
}

async function fetchWithRetry(
  orderCode: bigint,
  fetchPaymentRequest: ReconcileOptions["fetchPaymentRequest"],
  retries: number,
  retryDelay: NonNullable<ReconcileOptions["retryDelay"]>,
) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchPaymentRequest(orderCode);
    } catch (error) {
      lastError = error;
      if (attempt < retries) await retryDelay(attempt + 1);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("PayOS reconciliation request failed");
}

export async function reconcileStalePaymentOrders(options: ReconcileOptions): Promise<PaymentReconciliationSummary> {
  const startedAt = options.now ? new Date(options.now) : new Date();
  const olderThanHours = boundedInteger(options.olderThanHours, 24, 1, 24 * 30);
  const limit = boundedInteger(options.limit, 100, 1, 500);
  const retries = boundedInteger(options.retries, 2, 0, 5);
  const dryRun = options.dryRun ?? true;
  const retryDelay = options.retryDelay || ((attempt: number) => new Promise<void>((resolve) => {
    setTimeout(resolve, attempt * 250);
  }));
  const cutoff = new Date(startedAt.getTime() - olderThanHours * 3_600_000);
  const orders = await options.db.paymentOrder.findMany({
    where: { status: "PENDING", createdAt: { lte: cutoff } },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      orderCode: true,
      amountVnd: true,
      status: true,
      createdAt: true,
      rawPayload: true,
    },
  });
  const summary: PaymentReconciliationSummary = {
    dryRun,
    olderThanHours,
    scanned: orders.length,
    updated: 0,
    unchanged: 0,
    cancelled: 0,
    expired: 0,
    failed: 0,
    paidObserved: 0,
    mismatches: 0,
    providerErrors: 0,
    concurrentChanges: 0,
    startedAt,
    finishedAt: startedAt,
  };

  for (const order of orders) {
    let payment: PayOSReconciliationPayment;
    try {
      payment = await fetchWithRetry(order.orderCode, options.fetchPaymentRequest, retries, retryDelay);
    } catch {
      summary.providerErrors += 1;
      continue;
    }
    const decision = classifyPayOSReconciliation(order, payment);
    if (decision.kind === "unchanged") {
      summary.unchanged += 1;
      continue;
    }
    if (decision.kind === "paid_observed") {
      summary.paidObserved += 1;
      continue;
    }
    if (decision.kind === "mismatch") {
      summary.mismatches += 1;
      continue;
    }

    const counter = decision.status === "CANCELLED" ? "cancelled" : decision.status === "EXPIRED" ? "expired" : "failed";
    summary[counter] += 1;
    if (dryRun) continue;
    const previousPayload = isRecord(order.rawPayload) ? order.rawPayload : {};
    const update = await options.db.paymentOrder.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: {
        status: decision.status,
        rawPayload: {
          ...previousPayload,
          reconciliation: {
            provider: "payos",
            observedStatus: payment.status,
            checkedAt: startedAt.toISOString(),
            response: payment.raw,
          },
        },
      },
    });
    if (update.count === 1) summary.updated += 1;
    else summary.concurrentChanges += 1;
  }

  summary.finishedAt = options.now ? new Date(options.now) : new Date();
  if (!dryRun) {
    await options.db.paymentReconciliationRun.create({ data: summary });
  }
  return summary;
}

export function createPayOSReconciliationFetcher(options: {
  clientId: string;
  apiKey: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}) {
  const fetchImpl = options.fetchImpl || fetch;
  const timeoutMs = boundedInteger(options.timeoutMs, 10_000, 1_000, 30_000);
  return async (orderCode: bigint): Promise<PayOSReconciliationPayment> => {
    const response = await fetchImpl(`https://api-merchant.payos.vn/v2/payment-requests/${orderCode}`, {
      headers: { "x-client-id": options.clientId, "x-api-key": options.apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) throw new Error(`PayOS reconciliation failed with HTTP ${response.status}`);
    const json: unknown = await response.json();
    if (!isRecord(json) || !isRecord(json.data)) throw new Error("PayOS reconciliation returned invalid JSON");
    const data = json.data;
    const responseOrderCode = typeof data.orderCode === "bigint"
      ? data.orderCode
      : BigInt(String(data.orderCode ?? ""));
    const status = typeof data.status === "string" ? data.status : "";
    const amount = Number(data.amount);
    const amountPaid = Number(data.amountPaid || 0);
    if (!status || !Number.isFinite(amount) || !Number.isFinite(amountPaid)) {
      throw new Error("PayOS reconciliation response is missing required fields");
    }
    return { orderCode: responseOrderCode, amount, amountPaid, status, raw: json };
  };
}

export function parsePaymentReconciliationArgs(args: string[]) {
  const readNumber = (name: string, fallback: number) => {
    const value = args.find((item) => item.startsWith(`${name}=`))?.slice(name.length + 1);
    return value === undefined ? fallback : Number(value);
  };
  return {
    dryRun: !args.includes("--apply"),
    olderThanHours: boundedInteger(readNumber("--older-than-hours", 24), 24, 1, 24 * 30),
    limit: boundedInteger(readNumber("--limit", 100), 100, 1, 500),
  };
}
