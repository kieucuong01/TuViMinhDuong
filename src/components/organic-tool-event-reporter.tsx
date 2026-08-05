"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  organicToolClickEvents,
  organicToolRouteEvent,
  organicToolSubmitEvent,
  trackOrganicToolEvent,
} from "@/lib/client-analytics";

export function OrganicToolEventReporter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastRouteEvent = useRef("");

  useEffect(() => {
    const routeEvent = organicToolRouteEvent(pathname, searchParams);
    if (!routeEvent) {
      lastRouteEvent.current = "";
      return;
    }

    const routeEventKey = `${routeEvent.name}:${JSON.stringify(routeEvent.params)}`;
    if (lastRouteEvent.current === routeEventKey) return;
    lastRouteEvent.current = routeEventKey;
    trackOrganicToolEvent(routeEvent.name, routeEvent.params);
  }, [pathname, searchParams]);

  useEffect(() => {
    function reportSubmit(event: SubmitEvent) {
      if (!(event.target instanceof HTMLFormElement)) return;
      const organicEvent = organicToolSubmitEvent(event.target.dataset);
      if (organicEvent) trackOrganicToolEvent(organicEvent.name, organicEvent.params);
    }

    function reportClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const markedElement = event.target.closest<HTMLElement>("[data-organic-click]");
      if (!markedElement) return;
      for (const organicEvent of organicToolClickEvents(markedElement.dataset)) {
        trackOrganicToolEvent(organicEvent.name, organicEvent.params);
      }
    }

    document.addEventListener("submit", reportSubmit);
    document.addEventListener("click", reportClick);
    return () => {
      document.removeEventListener("submit", reportSubmit);
      document.removeEventListener("click", reportClick);
    };
  }, []);

  return null;
}
