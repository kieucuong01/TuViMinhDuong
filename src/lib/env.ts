const DEFAULT_APP_URL =
  process.env.NODE_ENV === "production" ? "https://tuviminhduong.com" : "http://localhost:4000";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || DEFAULT_APP_URL;

export const APP_NAME = "Tử Vi Minh Đường";

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
