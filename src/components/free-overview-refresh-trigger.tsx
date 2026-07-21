"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function FreeOverviewRefreshTrigger({ chartId, shouldRefresh }: { chartId: string; shouldRefresh: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!shouldRefresh) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function pollUntilReady(attempt = 0) {
      if (cancelled || attempt >= 30) return;

      try {
        const response = await fetch(`/api/charts/${encodeURIComponent(chartId)}/free-overview`, {
          cache: "no-store",
          credentials: "same-origin",
        });
        const payload = await response.json().catch(() => null);
        if (
          (payload?.status === "ready" && payload?.source === "llm") ||
          payload?.jobStatus === "failed" ||
          payload?.jobStatus === "stale"
        ) {
          router.refresh();
          return;
        }
      } catch {
        return;
      }

      timeoutId = setTimeout(() => {
        void pollUntilReady(attempt + 1);
      }, 2000);
    }

    void fetch(`/api/charts/${encodeURIComponent(chartId)}/free-overview/process`, {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
    }).finally(() => {
      void pollUntilReady();
    });

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [chartId, router, shouldRefresh]);

  return null;
}
