const DEFAULT_URL = "https://lasotinhhoa.vn/lap-la-so?utm_source=google&utm_medium=cpc&utm_campaign=smoke";

function normalizeAdsId(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const digits = raw.replace(/^AW-/i, "").replace(/[^\d]/g, "");
  return digits ? `AW-${digits}` : "";
}

function envLabel(name) {
  return String(process.env[name] || "").trim();
}

const targetUrl =
  process.env.ADS_SMOKE_URL ||
  (process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/lap-la-so?utm_source=google&utm_medium=cpc&utm_campaign=smoke`
    : DEFAULT_URL);

const expectedAdsId = normalizeAdsId(
  process.env.ADS_EXPECTED_GOOGLE_ADS_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID,
);

const expectedLabels = {
  create_chart: envLabel("NEXT_PUBLIC_GOOGLE_ADS_CREATE_CHART_LABEL"),
  begin_checkout: envLabel("NEXT_PUBLIC_GOOGLE_ADS_BEGIN_CHECKOUT_LABEL"),
  purchase: envLabel("NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL"),
  paid_reading_request: envLabel("NEXT_PUBLIC_GOOGLE_ADS_PAID_READING_LABEL"),
};

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS ${message}`);
}

console.log(`Google Ads smoke target: ${targetUrl}`);

const response = await fetch(targetUrl, {
  redirect: "follow",
  headers: {
    "user-agent": "LasotinhhoaGoogleAdsSmoke/1.0",
  },
});

if (!response.ok) {
  fail(`Landing page returned HTTP ${response.status}`);
  process.exit();
}

const html = await response.text();
const discoveredAdsIds = [...new Set(html.match(/AW-\d+/g) || [])];

if (html.includes("googletagmanager.com/gtag/js")) {
  pass("gtag loader is present");
} else {
  fail("gtag loader is missing from the landing page");
}

if (!expectedAdsId) {
  fail("Expected Google Ads ID is not configured locally. Set NEXT_PUBLIC_GOOGLE_ADS_ID or ADS_EXPECTED_GOOGLE_ADS_ID.");
} else if (discoveredAdsIds.includes(expectedAdsId) || html.includes(expectedAdsId)) {
  pass(`Google Ads config ${expectedAdsId} is present`);
} else {
  fail(`Expected ${expectedAdsId} was not found. Found: ${discoveredAdsIds.join(", ") || "none"}`);
}

const missingLabels = Object.entries(expectedLabels)
  .filter(([, value]) => !value)
  .map(([eventName]) => eventName);

if (missingLabels.length) {
  fail(`Missing conversion labels for: ${missingLabels.join(", ")}`);
} else {
  pass("All conversion labels are configured in local env for manual Tag Assistant checks");
}

console.log("");
console.log("Manual Tag Assistant smoke:");
console.log("1. Open Tag Assistant and connect to the target URL above.");
console.log("2. Confirm the AW tag is detected on /lap-la-so.");
console.log("3. Create a test chart and confirm create_chart fires once.");
console.log("4. For purchase, confirm conversion fires only after /api/payments/status verifies a PAID order.");
