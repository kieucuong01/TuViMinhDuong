export const QUAN_INVITE_MS = 120_000;
export const QUAN_OUTAGE_MS = 120_000;
export const QUAN_TURN_MS = 30_000;

export function getQuanPackage(minutes: unknown) {
  if (minutes === 15) return { minutes, amountVnd: 100_000 };
  if (minutes === 30) return { minutes, amountVnd: 200_000 };
  return null;
}

export function isExactQuanPayment(
  payment: { status?: string; amount?: number; amountPaid?: number } | null,
  amountVnd: number,
) {
  return payment?.status === "PAID" && payment.amount === amountVnd && payment.amountPaid === amountVnd;
}

export function getQuanQueueWait(tableSeconds: number[], queuedMinutes: number[]) {
  if (!tableSeconds.length) return undefined;
  const remaining = [...tableSeconds];
  for (const minutes of queuedMinutes) {
    const first = remaining.indexOf(Math.min(...remaining));
    remaining[first] += minutes * 60;
  }
  return Math.min(...remaining);
}

export function quanRefundAmount(amountVnd: number, minutes: number, unservedMs: number) {
  return Math.ceil(amountVnd * Math.min(1, Math.max(0, unservedMs / (minutes * 60_000))));
}
