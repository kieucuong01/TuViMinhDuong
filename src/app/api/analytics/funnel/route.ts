import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { FUNNEL_SESSION_COOKIE, parseClientFunnelEvent, recordFunnelEventBestEffort } from "@/lib/funnel-events";
import { checkRateLimit, rateLimitKeyFromHeaders } from "@/lib/rate-limit";

const FUNNEL_RATE_LIMIT = 60;
const FUNNEL_RATE_WINDOW_MS = 60 * 1000;
const MAX_BODY_BYTES = 2 * 1024;

function requestOriginCandidates(request: Request, requestUrl: URL) {
  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || requestUrl.protocol.replace(":", "") || "https";
  return new Set([
    requestUrl.origin,
    forwardedHost ? `${forwardedProto}://${forwardedHost}` : "",
  ].filter(Boolean));
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && !requestOriginCandidates(request, url).has(origin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Invalid event" }, { status: 413 });
  }

  const rateLimit = checkRateLimit(rateLimitKeyFromHeaders("funnel", request.headers), {
    limit: FUNNEL_RATE_LIMIT,
    windowMs: FUNNEL_RATE_WINDOW_MS,
  });
  if (rateLimit.rateLimited) {
    return NextResponse.json({ error: "Too many events" }, { status: 429 });
  }

  const parsed = parseClientFunnelEvent(await request.json().catch(() => null));
  if (!parsed) return NextResponse.json({ error: "Invalid event" }, { status: 400 });

  const user = await getCurrentUser();
  await recordFunnelEventBestEffort({
    name: parsed.name,
    anonymousSessionId: parsed.anonymousSessionId,
    userId: user?.id,
    source: parsed.source || "unknown",
    landingClass: parsed.landingClass || "other",
    tool: parsed.tool || "other",
    placement: parsed.placement,
    resultBand: parsed.resultBand,
    dedupeKey: `client:${parsed.anonymousSessionId}:${parsed.eventId}`,
  });

  const response = NextResponse.json({ accepted: true }, { status: 202 });
  response.cookies.set(FUNNEL_SESSION_COOKIE, parsed.anonymousSessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
