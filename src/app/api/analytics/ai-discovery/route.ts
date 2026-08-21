import { NextResponse } from "next/server";

import { parseAiDiscoverySubmission } from "@/lib/ai-discovery";
import { recordAiDiscoveryResponse } from "@/lib/ai-discovery-store";
import { getCurrentUser } from "@/lib/auth";
import { getServerFunnelSessionId } from "@/lib/funnel-events";
import { checkRateLimit, rateLimitKeyFromHeaders } from "@/lib/rate-limit";

const AI_DISCOVERY_RATE_LIMIT = 6;
const AI_DISCOVERY_RATE_WINDOW_MS = 24 * 60 * 60 * 1000;
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
    return NextResponse.json({ error: "Invalid response" }, { status: 413 });
  }

  const rateLimit = checkRateLimit(rateLimitKeyFromHeaders("ai-discovery", request.headers), {
    limit: AI_DISCOVERY_RATE_LIMIT,
    windowMs: AI_DISCOVERY_RATE_WINDOW_MS,
  });
  if (rateLimit.rateLimited) {
    return NextResponse.json({ error: "Too many responses" }, { status: 429 });
  }

  const submission = parseAiDiscoverySubmission(await request.json().catch(() => null));
  if (!submission) return NextResponse.json({ error: "Invalid response" }, { status: 400 });

  const [user, funnelSessionId] = await Promise.all([getCurrentUser(), getServerFunnelSessionId()]);
  const result = await recordAiDiscoveryResponse({
    submission,
    userId: user?.id,
    funnelSessionId,
  }).catch(() => "unavailable" as const);

  if (result === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (result === "unavailable") return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  return NextResponse.json({ accepted: true }, { status: 202 });
}
