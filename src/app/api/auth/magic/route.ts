import { NextResponse } from "next/server";
import { signInWithMagicToken } from "@/lib/auth";
import { AUTH_RATE_LIMIT_WINDOW_MS, MAGIC_LOGIN_RATE_LIMIT, checkRateLimit, rateLimitKeyFromHeaders } from "@/lib/rate-limit";
import { recordAccountFunnelEvent } from "@/lib/funnel-events";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  const next = safeNext(url.searchParams.get("next"));
  const rateLimit = checkRateLimit(rateLimitKeyFromHeaders("magic", request.headers), {
    limit: MAGIC_LOGIN_RATE_LIMIT,
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  });
  if (rateLimit.rateLimited) {
    return NextResponse.redirect(new URL(`/dang-nhap?next=${encodeURIComponent(next)}&error=${encodeURIComponent("Bạn thử link truy cập quá nhiều lần. Vui lòng chờ ít phút rồi thử lại.")}`, url.origin));
  }
  const user = await signInWithMagicToken(token);
  if (!user) {
    return NextResponse.redirect(new URL(`/dang-nhap?next=${encodeURIComponent(next)}&error=${encodeURIComponent("Link truy cập đã hết hạn hoặc không hợp lệ.")}`, url.origin));
  }

  await recordAccountFunnelEvent(user.id, "magic_login");

  return NextResponse.redirect(new URL(next, url.origin));
}
