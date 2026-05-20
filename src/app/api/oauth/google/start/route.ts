import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { APP_URL, isGoogleOAuthEnabled } from "@/lib/env";

export async function GET(request: Request) {
  if (!isGoogleOAuthEnabled()) {
    return NextResponse.redirect(`${APP_URL}/dang-nhap?error=${encodeURIComponent("Google OAuth chưa được cấu hình.")}`);
  }
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/";
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
    redirect_uri: `${APP_URL}/api/oauth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
