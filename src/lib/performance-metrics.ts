export type JourneyRoute = "home" | "chart-result";

export type PerformanceSample = {
  route: JourneyRoute;
  lcpMs: number;
  cls: number;
  ttfbMs: number;
  htmlBytes: number;
  initialJsBytes: number;
};

export type PerformanceSummary = PerformanceSample & { samples: number };

export type PerformanceBottleneck = "lcpMs" | "ttfbMs" | "htmlBytes" | "initialJsBytes";

const ROUTE_ORDER: JourneyRoute[] = ["home", "chart-result"];
const BOTTLENECK_ORDER: PerformanceBottleneck[] = ["lcpMs", "ttfbMs", "htmlBytes", "initialJsBytes"];
const BOTTLENECK_REFERENCES: Record<PerformanceBottleneck, number> = {
  lcpMs: 2_500,
  ttfbMs: 800,
  htmlBytes: 150_000,
  initialJsBytes: 200_000,
};

export function median(values: number[]): number {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new Error("Median requires at least one finite value.");
  }

  const ordered = values.toSorted((left, right) => left - right);
  const midpoint = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0
    ? (ordered[midpoint - 1] + ordered[midpoint]) / 2
    : ordered[midpoint];
}

function roundMetric(key: keyof PerformanceSample, value: number) {
  return key === "cls" ? Number(value.toFixed(4)) : Math.round(value);
}

export function summarize(samples: PerformanceSample[]): PerformanceSummary[] {
  if (samples.length === 0) throw new Error("Performance summary requires at least one sample.");

  return ROUTE_ORDER.flatMap((route) => {
    const routeSamples = samples.filter((sample) => sample.route === route);
    if (routeSamples.length === 0) return [];

    const values = (key: Exclude<keyof PerformanceSample, "route">) => routeSamples.map((sample) => sample[key]);
    return [{
      route,
      lcpMs: roundMetric("lcpMs", median(values("lcpMs"))),
      cls: roundMetric("cls", median(values("cls"))),
      ttfbMs: roundMetric("ttfbMs", median(values("ttfbMs"))),
      htmlBytes: roundMetric("htmlBytes", median(values("htmlBytes"))),
      initialJsBytes: roundMetric("initialJsBytes", median(values("initialJsBytes"))),
      samples: routeSamples.length,
    }];
  });
}

export function selectPrimaryBottleneck(summary: PerformanceSummary): PerformanceBottleneck {
  return BOTTLENECK_ORDER.reduce((selected, candidate) => {
    const selectedRatio = summary[selected] / BOTTLENECK_REFERENCES[selected];
    const candidateRatio = summary[candidate] / BOTTLENECK_REFERENCES[candidate];
    return candidateRatio > selectedRatio ? candidate : selected;
  });
}

export function evaluateBudget(
  before: PerformanceSummary,
  after: PerformanceSummary,
  bottleneck: PerformanceBottleneck,
): { passed: boolean; reasons: string[]; improvementPct: number } {
  if (before.route !== after.route) throw new Error("Performance summaries must describe the same route.");
  if (!Number.isFinite(before[bottleneck]) || before[bottleneck] <= 0 || !Number.isFinite(after[bottleneck])) {
    throw new Error(`Cannot evaluate invalid ${bottleneck} values.`);
  }

  const reasons: string[] = [];
  const improvementPct = Number((((before[bottleneck] - after[bottleneck]) / before[bottleneck]) * 100).toFixed(1));

  if (after.lcpMs > 2_500) reasons.push(`LCP ${after.lcpMs}ms exceeds 2500ms`);
  if (after.cls > 0.1) reasons.push(`CLS ${after.cls} exceeds 0.1`);
  if (after.initialJsBytes > before.initialJsBytes) {
    reasons.push(`Initial JavaScript increased from ${before.initialJsBytes} to ${after.initialJsBytes} bytes`);
  }
  if (before.lcpMs <= 2_500 && before.cls <= 0.1 && improvementPct < 15) {
    reasons.push(`${bottleneck} improved ${improvementPct}%, below required 15%`);
  }

  return { passed: reasons.length === 0, reasons, improvementPct };
}
