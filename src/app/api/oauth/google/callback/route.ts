import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_EMAIL, isGoogleOAuthEnabled } from "@/lib/env";
import { getDb } from "@/lib/db";
import { setSession, type SessionUser } from "@/lib/auth";
import {
  googleOAuthCallbackUrl,
  googleOAuthErrorUrl,
  normalizeGoogleProfile,
  parseGoogleOAuthState,
} from "@/lib/google-oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const stored = jar.get("google_oauth_state")?.value;
  const parsed = parseGoogleOAuthState(stored);
  jar.delete("google_oauth_state");

  if (!isGoogleOAuthEnabled()) {
    return NextResponse.redirect(googleOAuthErrorUrl("Google OAuth chưa được cấu hình.", parsed?.next));
  }

  if (!code || !state || parsed?.state !== state) {
    return NextResponse.redirect(googleOAuthErrorUrl("Google OAuth không hợp lệ.", parsed?.next));
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: googleOAuthCallbackUrl(),
        grant_type: "authorization_code",
      }),
    });
    const token = await tokenResponse.json();
    if (!tokenResponse.ok || typeof token.access_token !== "string") {
      console.error("google_oauth_token_failed", { status: tokenResponse.status, error: token.error });
      return NextResponse.redirect(googleOAuthErrorUrl("Không đăng nhập Google được. Bạn thử lại giúp mình nhé.", parsed.next));
    }

    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const rawProfile = await profileResponse.json();
    const profile = normalizeGoogleProfile(rawProfile);
    if (!profileResponse.ok || !profile) {
      console.error("google_oauth_profile_failed", { status: profileResponse.status });
      return NextResponse.redirect(googleOAuthErrorUrl("Không lấy được email Google đã xác minh.", parsed.next));
    }

    const role = profile.email === ADMIN_EMAIL ? "ADMIN" : "USER";
    const db = getDb();
    let user: SessionUser;

    if (db) {
      const saved = await db.user.upsert({
        where: { email: profile.email },
        update: { name: profile.name, avatarUrl: profile.picture, role },
        create: {
          email: profile.email,
          name: profile.name,
          avatarUrl: profile.picture,
          role,
          coinBalance: role === "ADMIN" ? 9999 : 30,
        },
      });
      await db.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: "google",
            providerAccountId: profile.providerAccountId,
          },
        },
        update: {
          accessToken: token.access_token,
          refreshToken: typeof token.refresh_token === "string" ? token.refresh_token : undefined,
          expiresAt: typeof token.expires_in === "number" ? new Date(Date.now() + token.expires_in * 1000) : undefined,
        },
        create: {
          userId: saved.id,
          provider: "google",
          providerAccountId: profile.providerAccountId,
          accessToken: token.access_token,
          refreshToken: typeof token.refresh_token === "string" ? token.refresh_token : undefined,
          expiresAt: typeof token.expires_in === "number" ? new Date(Date.now() + token.expires_in * 1000) : undefined,
        },
      });
      user = {
        id: saved.id,
        email: saved.email,
        name: saved.name || profile.email.split("@")[0],
        role: saved.role,
        coinBalance: saved.coinBalance,
      };
    } else {
      user = {
        id: `demo-google-${profile.email}`,
        email: profile.email,
        name: profile.name || profile.email.split("@")[0],
        role,
        coinBalance: role === "ADMIN" ? 9999 : 30,
      };
    }

    await setSession(user);
    return NextResponse.redirect(new URL(parsed.next, url.origin));
  } catch (error) {
    console.error("google_oauth_callback_failed", error);
    return NextResponse.redirect(googleOAuthErrorUrl("Đăng nhập Google tạm thời chưa hoàn tất. Bạn thử lại giúp mình nhé.", parsed.next));
  }
}
