/** A paused balance has no deadline; only an active visit spends time. */
export function quanRemainingMs(row: { remainingMs: number | null; endsAt: Date | null; outageSince: Date | null }, totalMs: number, now: Date) {
  return Math.max(0, row.endsAt ? row.endsAt.getTime() - (row.outageSince ?? now).getTime() : row.remainingMs ?? totalMs);
}
