import { normalizeGoogleAdsId, type GoogleAdsEventName } from "@/lib/google-ads";

const DEFAULT_APP_URL =
  process.env.NODE_ENV === "production" ? "https://lasotinhhoa.vn" : "http://localhost:4000";

const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

export const APP_URL = configuredAppUrl || DEFAULT_APP_URL;

export const GOOGLE_ANALYTICS_ID =
  process.env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-5JSNC2T5G0";

export const GOOGLE_ADS_ID = normalizeGoogleAdsId(
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID,
);

export const GOOGLE_ADS_LABELS: Partial<Record<GoogleAdsEventName, string | undefined>> = {
  create_chart: process.env.NEXT_PUBLIC_GOOGLE_ADS_CREATE_CHART_LABEL,
  begin_checkout: process.env.NEXT_PUBLIC_GOOGLE_ADS_BEGIN_CHECKOUT_LABEL,
  purchase: process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL,
  paid_reading_request: process.env.NEXT_PUBLIC_GOOGLE_ADS_PAID_READING_LABEL,
};

export const APP_NAME = "Lá số tinh hoa";

export const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL?.toLowerCase() || "kieucuong01@gmail.com";

export const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "";

export function databaseEnvState() {
  const value = process.env.DATABASE_URL;
  if (!value) return "missing";
  if (value.includes("johndoe:randompassword")) return "placeholder";
  return "configured";
}

export function hasDatabaseUrl() {
  return databaseEnvState() === "configured";
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
