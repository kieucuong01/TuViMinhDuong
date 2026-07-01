export const PREMIUM_READING_TARGET_ID = "mo-khoa-ho-so-vip";
export const PREMIUM_READING_HASH = `#${PREMIUM_READING_TARGET_ID}`;

export function premiumReadingModalId(chartId: string) {
  return `premium-confirm-${chartId}`;
}
