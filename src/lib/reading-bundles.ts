import type { TuViChart } from "@/lib/chart";
import { getMajorFateItems, getMinorFateItems, getMonthlyFateItems } from "@/lib/fate-analysis";
import { getPalaceReadingItems } from "@/lib/palace-analysis";
import type { ReadingKey } from "@/lib/pricing";

export type ReadingBundleKey = "PALACE" | "DAI_VAN" | "TIEU_VAN" | "NGUYET_VAN";

export const READING_BUNDLE_SCOPE_PREFIX = "__bundle__";

const BUNDLE_LABELS: Record<ReadingBundleKey, string> = {
  PALACE: "Luận cung",
  DAI_VAN: "Đại vận",
  TIEU_VAN: "Tiểu vận",
  NGUYET_VAN: "Nguyệt vận",
};

export function isReadingBundleKey(type: ReadingKey): type is ReadingBundleKey {
  return type === "PALACE" || type === "DAI_VAN" || type === "TIEU_VAN" || type === "NGUYET_VAN";
}

export function readingBundleScopeKey(type: ReadingBundleKey) {
  return `${READING_BUNDLE_SCOPE_PREFIX}:${type}`;
}

export function readingBundleLabel(type: ReadingBundleKey) {
  return BUNDLE_LABELS[type];
}

export function readingBundleItemPrice(unitPrice: number, itemCount: number) {
  return Math.ceil(Math.max(0, unitPrice) * Math.max(0, itemCount) * 0.5);
}

export function readingBundleItems(chart: TuViChart, type: ReadingBundleKey) {
  if (type === "PALACE") {
    return getPalaceReadingItems(chart).map((item) => ({ title: item.title, scopeKey: item.palace.name }));
  }
  if (type === "DAI_VAN") {
    return getMajorFateItems(chart).map((item) => ({ title: item.title, scopeKey: item.scopeKey }));
  }
  if (type === "TIEU_VAN") {
    return getMinorFateItems(chart).map((item) => ({ title: item.title, scopeKey: item.scopeKey }));
  }
  return getMonthlyFateItems(chart).map((item) => ({ title: item.title, scopeKey: item.scopeKey }));
}
