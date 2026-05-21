"use client";

import { useEffect } from "react";

const MAX_REPORTS_PER_SESSION = 3;

function sendErrorReport(payload: Record<string, unknown>) {
  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    const body = JSON.stringify(payload);
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon("/api/telemetry/error", blob)) return;
  }

  void fetch("/api/telemetry/error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined);
}

export function ClientErrorReporter() {
  useEffect(() => {
    let sent = 0;

    const report = (payload: Record<string, unknown>) => {
      if (sent >= MAX_REPORTS_PER_SESSION) return;
      sent += 1;
      sendErrorReport({
        ...payload,
        path: window.location.pathname,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
    };

    const onError = (event: ErrorEvent) => {
      report({
        kind: "window_error",
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error instanceof Error ? event.error.stack : undefined,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      report({
        kind: "unhandled_rejection",
        message: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
