import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isGoogleOAuthEnabled } from "@/lib/env";
import { googleOAuthCallbackUrl, googleOAuthErrorUrl, safeOAuthNextPath } from "@/lib/google-oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeOAuthNextPath(url.searchParams.get("next"));
  if (!isGoogleOAuthEnabled()) {
    return NextResponse.redirect(googleOAuthErrorUrl("Google OAuth chưa được cấu hình.", next));
  }

  const state = crypto.randomUUID();
  const jar = await cookies();
  jar.set("google_oauth_state", JSON.stringify({ state, next }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: googleOAuthCallbackUrl(),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
