import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FIELD_LENGTH = 900;

function clean(value: unknown) {
  if (typeof value !== "string") return undefined;
  return value.slice(0, MAX_FIELD_LENGTH);
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 12_000) {
      return NextResponse.json({ ok: false }, { status: 413 });
    }

    const payload = await request.json().catch(() => ({}));
    const report = {
      level: "error",
      event: "client_error",
      kind: clean(payload.kind) || "unknown",
      message: clean(payload.message) || "Unknown client error",
      path: clean(payload.path),
      source: clean(payload.source),
      line: typeof payload.line === "number" ? payload.line : undefined,
      column: typeof payload.column === "number" ? payload.column : undefined,
      stack: clean(payload.stack),
      userAgent: clean(payload.userAgent),
      timestamp: clean(payload.timestamp) || new Date().toISOString(),
    };

    console.error(JSON.stringify(report));

    if (process.env.ERROR_WEBHOOK_URL) {
      await fetch(process.env.ERROR_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      }).catch(() => undefined);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      event: "client_error_report_failed",
      message: error instanceof Error ? error.message : "Unknown error",
    }));
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
