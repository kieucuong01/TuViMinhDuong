"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { TuViChart } from "@/lib/chart";

const DynamicChartActionPanel = dynamic(() => import("@/components/chart-action-panel").then((mod) => mod.ChartActionPanel), {
  ssr: false,
  loading: () => <ChartActionPanelPlaceholder />,
});

function ChartActionPanelPlaceholder() {
  return (
    <section className="chart-action-panel chart-action-panel-placeholder" aria-label="Thao tác với lá số">
      <div className="chart-action-row" aria-hidden="true">
        <span className="chart-action-button" />
        <span className="chart-action-button" />
        <span className="chart-action-button" />
        <span className="chart-action-button" />
      </div>
    </section>
  );
}

export function DeferredChartActionPanel({ chartId, chart }: { chartId: string; chart: TuViChart }) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldLoad) return;
    const target = rootRef.current;
    const idleTimer = window.setTimeout(() => setShouldLoad(true), 3500);

    if (!target || !("IntersectionObserver" in window)) {
      return () => window.clearTimeout(idleTimer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShouldLoad(true);
        observer.disconnect();
        window.clearTimeout(idleTimer);
      },
      { rootMargin: "700px 0px" },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
      window.clearTimeout(idleTimer);
    };
  }, [shouldLoad]);

  return (
    <div ref={rootRef}>
      {shouldLoad ? <DynamicChartActionPanel chartId={chartId} chart={chart} /> : <ChartActionPanelPlaceholder />}
    </div>
  );
}
