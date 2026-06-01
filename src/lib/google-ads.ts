export const GOOGLE_ADS_CONVERSION_EVENTS = [
  "create_chart",
  "begin_checkout",
  "purchase",
  "paid_reading_request",
] as const;

export type GoogleAdsEventName = (typeof GOOGLE_ADS_CONVERSION_EVENTS)[number];

export const GOOGLE_ADS_EVENT_VALUES: Record<GoogleAdsEventName, number> = {
  create_chart: 5000,
  begin_checkout: 25000,
  purchase: 0,
  paid_reading_request: 50000,
};

export function normalizeGoogleAdsId(value?: string | null) {
  const trimmed = value?.trim() || "";
  if (!trimmed) return "";
  return trimmed.startsWith("AW-") ? trimmed : `AW-${trimmed}`;
}

export function shouldTrackGoogleAdsConversion(eventName: string): eventName is GoogleAdsEventName {
  return (GOOGLE_ADS_CONVERSION_EVENTS as readonly string[]).includes(eventName);
}

export function googleAdsSendTo(
  conversionId: string,
  labels: Partial<Record<GoogleAdsEventName, string | undefined>>,
  eventName: string,
) {
  if (!shouldTrackGoogleAdsConversion(eventName)) return null;
  const normalizedId = normalizeGoogleAdsId(conversionId);
  const label = labels[eventName]?.trim();
  return normalizedId && label ? `${normalizedId}/${label}` : null;
}
