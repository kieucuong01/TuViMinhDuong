import Script from "next/script";
import { Suspense } from "react";
import { GoogleAdsEventReporter } from "@/components/google-ads-event-reporter";
import { GoogleAnalyticsPageView } from "@/components/google-analytics-page-view";
import { GOOGLE_ADS_ID, GOOGLE_ANALYTICS_ID } from "@/lib/env";

export function GoogleAnalytics() {
  const tagId = GOOGLE_ANALYTICS_ID || GOOGLE_ADS_ID;
  if (!tagId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${tagId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = window.gtag || gtag;
          gtag('js', new Date());
          ${GOOGLE_ANALYTICS_ID ? `gtag('config', '${GOOGLE_ANALYTICS_ID}', { send_page_view: false });` : ""}
          ${GOOGLE_ADS_ID ? `gtag('config', '${GOOGLE_ADS_ID}');` : ""}
        `}
      </Script>
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
