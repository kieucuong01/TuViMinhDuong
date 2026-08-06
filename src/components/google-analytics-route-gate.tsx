"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { GoogleAdsEventReporter } from "@/components/google-ads-event-reporter";
import { GoogleAnalyticsDeferredLoader } from "@/components/google-analytics-deferred-loader";
import { OrganicToolEventReporter } from "@/components/organic-tool-event-reporter";
import { FirstPartyFunnelReporter } from "@/components/first-party-funnel-reporter";

type GoogleAnalyticsRouteGateProps = {
  tagId: string;
  measurementId?: string;
  adsId?: string;
};

export function GoogleAnalyticsRouteGate({ tagId, measurementId, adsId }: GoogleAnalyticsRouteGateProps) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;

  return (
    <>
      <GoogleAnalyticsDeferredLoader
        tagId={tagId}
        measurementId={measurementId}
        adsId={adsId}
      />
      <Suspense fallback={null}>
        <GoogleAdsEventReporter />
        <OrganicToolEventReporter />
        <FirstPartyFunnelReporter />
      </Suspense>
    </>
  );
}
