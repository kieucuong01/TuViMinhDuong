const DEFAULT_APP_URL =
  process.env.NODE_ENV === "production" ? "https://tu-vi-minh-duong.vercel.app" : "http://localhost:4000";

const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
const pendingCustomDomains = new Set(["https://lasotinhhoa.vn", "https://www.lasotinhhoa.vn"]);

export const APP_URL =
  configuredAppUrl && !pendingCustomDomains.has(configuredAppUrl) ? configuredAppUrl : DEFAULT_APP_URL;

export const APP_NAME = "Lá số tinh hoa";

export const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL?.toLowerCase() || "kieucuong01@gmail.com";

export const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "";

export function hasDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  return Boolean(value && !value.includes("johndoe:randompassword"));
}

export function isGoogleOAuthEnabled() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function isPayOSEnabled() {
  return Boolean(
    process.env.PAYOS_CLIENT_ID &&
      process.env.PAYOS_API_KEY &&
      process.env.PAYOS_CHECKSUM_KEY,
  );
}
