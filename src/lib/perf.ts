type PerfFields = Record<string, unknown> & {
  force?: boolean;
};

function nowMs() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function roundedMs(value: number) {
  return Math.round(value * 10) / 10;
}

export function createPerfTimer() {
  const startedAt = nowMs();
  const timings: Record<string, number> = {};

  return {
    async time<T>(name: string, task: () => T | Promise<T>) {
      const stepStartedAt = nowMs();
      try {
        return await task();
      } finally {
        timings[name] = roundedMs(nowMs() - stepStartedAt);
      }
    },
    mark(name: string) {
      timings[name] = roundedMs(nowMs() - startedAt);
    },
    total() {
      return roundedMs(nowMs() - startedAt);
    },
    timings() {
      return { ...timings };
    },
    serverTiming() {
      return Object.entries(timings)
        .map(([name, duration]) => `${name};dur=${duration}`)
        .join(", ");
    },
  };
}

export function logPerfEvent(event: string, durationMs: number, fields: PerfFields = {}) {
  const thresholdMs = Number(process.env.PERF_LOG_THRESHOLD_MS || 500);
  const { force, ...payloadFields } = fields;
  if (!force && process.env.PERF_LOG !== "1" && durationMs < thresholdMs) return;

  console.info(JSON.stringify({
    level: "info",
    event,
    durationMs: roundedMs(durationMs),
    ...payloadFields,
  }));
}
