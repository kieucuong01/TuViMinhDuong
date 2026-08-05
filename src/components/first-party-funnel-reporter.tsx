"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { classifyClientFunnelContext, reportFirstPartyFunnelEvent } from "@/lib/first-party-funnel-client";

export function FirstPartyFunnelReporter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const context = classifyClientFunnelContext({
      pathname,
      search: searchParams.toString(),
      referrer: document.referrer,
    });
    reportFirstPartyFunnelEvent("landing", { tool: context.tool });
    if (context.tool !== "other" && context.tool !== "knowledge") {
      reportFirstPartyFunnelEvent("tool_view", { tool: context.tool });
    }
  }, [pathname, searchParams]);

  return null;
}
