import { GoogleAnalyticsRouteGate } from "@/components/google-analytics-route-gate";
import { GOOGLE_ADS_ID, GOOGLE_ANALYTICS_ID } from "@/lib/env";

export function GoogleAnalytics() {
  const tagId = GOOGLE_ANALYTICS_ID || GOOGLE_ADS_ID;
  if (!tagId) return null;

  return (
    <GoogleAnalyticsRouteGate
      tagId={tagId}
      measurementId={GOOGLE_ANALYTICS_ID}
      adsId={GOOGLE_ADS_ID}
    />
  );
}
