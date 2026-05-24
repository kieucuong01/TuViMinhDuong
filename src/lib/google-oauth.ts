import { APP_URL } from "@/lib/env";

export type GoogleOAuthState = {
  state: string;
  next: string;
};

export type NormalizedGoogleProfile = {
  providerAccountId: string;
  email: string;
  name?: string;
  picture?: string;
};

export function safeOAuthNextPath(value?: string | null) {
  const next = value?.trim();
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export function parseGoogleOAuthState(value?: string | null): GoogleOAuthState | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<GoogleOAuthState>;
    if (typeof parsed.state !== "string" || !parsed.state) return null;
    return {
      state: parsed.state,
      next: safeOAuthNextPath(parsed.next),
    };
  } catch {
    return null;
  }
}

export function googleOAuthCallbackUrl() {
  return `${APP_URL}/api/oauth/google/callback`;
}

export function googleOAuthErrorUrl(message: string, next?: string | null) {
  const url = new URL("/dang-nhap", APP_URL);
  const safeNext = safeOAuthNextPath(next);
  if (safeNext !== "/") url.searchParams.set("next", safeNext);
  url.searchParams.set("error", message);
  return url.toString();
}

export function normalizeGoogleProfile(profile: unknown): NormalizedGoogleProfile | null {
  if (!profile || typeof profile !== "object") return null;
  const data = profile as Record<string, unknown>;
  const providerAccountId = typeof data.sub === "string" ? data.sub : "";
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const isEmailUnverified = data.email_verified === false || data.email_verified === "false";
  if (!providerAccountId || !email || isEmailUnverified) return null;

  return {
    providerAccountId,
    email,
    name: typeof data.name === "string" ? data.name : undefined,
    picture: typeof data.picture === "string" ? data.picture : undefined,
  };
}
