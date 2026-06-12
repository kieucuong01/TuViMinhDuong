import { Suspense } from "react";
import { GoogleAdsEventReporter } from "@/components/google-ads-event-reporter";
import { GoogleAnalyticsDeferredLoader } from "@/components/google-analytics-deferred-loader";
import { GoogleAnalyticsPageView } from "@/components/google-analytics-page-view";
import { GOOGLE_ADS_ID, GOOGLE_ANALYTICS_ID } from "@/lib/env";

export function GoogleAnalytics() {
  const tagId = GOOGLE_ANALYTICS_ID || GOOGLE_ADS_ID;
  if (!tagId) return null;

  return (
    <>
      <GoogleAnalyticsDeferredLoader
        tagId={tagId}
        measurementId={GOOGLE_ANALYTICS_ID}
        adsId={GOOGLE_ADS_ID}
      />
      {GOOGLE_ANALYTICS_ID ? (
        <Suspense fallback={null}>
          <GoogleAnalyticsPageView measurementId={GOOGLE_ANALYTICS_ID} />
        </Suspense>
      ) : null}
      <Suspense fallback={null}>
        <GoogleAdsEventReporter />
      </Suspense>
    </>
  );
}
