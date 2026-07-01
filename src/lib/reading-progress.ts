export type ReadingProgressInput = {
  chapterKey: string;
  chapterIndex: number;
  percent: number;
  chapterOffset: number;
};

export function parseReadingProgressInput(value: unknown): ReadingProgressInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const chapterKey = typeof input.chapterKey === "string" ? input.chapterKey : "";
  const chapterIndex = input.chapterIndex;
  const percent = input.percent;
  const chapterOffset = input.chapterOffset;

  if (!/^[a-z0-9-]{1,160}$/.test(chapterKey)) return null;
  if (!Number.isInteger(chapterIndex) || Number(chapterIndex) < 0 || Number(chapterIndex) > 50) return null;
  if (!Number.isInteger(percent) || Number(percent) < 0 || Number(percent) > 100) return null;
  if (typeof chapterOffset !== "number" || !Number.isFinite(chapterOffset) || chapterOffset < 0 || chapterOffset > 1) return null;

  return {
    chapterKey,
    chapterIndex: Number(chapterIndex),
    percent: Number(percent),
    chapterOffset,
  };
}

export function calculateReadingPercent(scrollY: number, reportTop: number, reportBottom: number) {
  const distance = reportBottom - reportTop;
  if (!Number.isFinite(distance) || distance <= 0) return 0;
  const ratio = (scrollY - reportTop) / distance;
  return Math.round(Math.max(0, Math.min(1, ratio)) * 100);
}
