import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { APP_URL, ADMIN_EMAIL } from "@/lib/env";
import { getDb } from "@/lib/db";
import { setSession, type SessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const stored = jar.get("google_oauth_state")?.value;
  const parsed = stored ? JSON.parse(stored) : null;
  jar.delete("google_oauth_state");

  if (!code || !state || parsed?.state !== state) {
    return NextResponse.redirect(`${APP_URL}/dang-nhap?error=${encodeURIComponent("Google OAuth không hợp lệ.")}`);
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: `${APP_URL}/api/oauth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  const token = await tokenResponse.json();
  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const profile = await profileResponse.json();
  const email = String(profile.email || "").toLowerCase();
  if (!email) return NextResponse.redirect(`${APP_URL}/dang-nhap?error=${encodeURIComponent("Không lấy được email Google.")}`);

  const role = email === ADMIN_EMAIL ? "ADMIN" : "USER";
  const db = getDb();
  let user: SessionUser;

  if (db) {
    const saved = await db.user.upsert({
      where: { email },
      update: { name: profile.name, avatarUrl: profile.picture, role },
      create: { email, name: profile.name, avatarUrl: profile.picture, role, coinBalance: role === "ADMIN" ? 9999 : 30 },
    });
    await db.account.upsert({
      where: { provider_providerAccountId: { provider: "google", providerAccountId: profile.sub } },
      update: { accessToken: token.access_token },
      create: { userId: saved.id, provider: "google", providerAccountId: profile.sub, accessToken: token.access_token },
    });
    user = { id: saved.id, email: saved.email, name: saved.name || email.split("@")[0], role: saved.role, coinBalance: saved.coinBalance };
  } else {
    user = { id: `demo-google-${email}`, email, name: profile.name || email.split("@")[0], role, coinBalance: role === "ADMIN" ? 9999 : 30 };
  }

  await setSession(user);
  return NextResponse.redirect(`${APP_URL}${parsed.next || "/"}`);
}
