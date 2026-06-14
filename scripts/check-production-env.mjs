import "dotenv/config";

const envRows = Object.entries(process.env)
  .sort(([a], [b]) => a.localeCompare(b))
  .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

const coreRequired = [
  "DATABASE_URL",
  "NEXT_PUBLIC_APP_URL",
  "AUTH_SECRET",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
];

const googleOAuthVars = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"];
const payosVars = ["PAYOS_CLIENT_ID", "PAYOS_API_KEY", "PAYOS_CHECKSUM_KEY"];
const llmVarGroups = [
  ["GEMINI_API_KEY", "GEMINI_API_KEYS"],
  ["GROQ_API_KEY", "GROQ_API_KEYS"],
];

function hasValue(name) {
  const value = envRows[name];
  return typeof value === "string" && value.trim().length > 0;
}

function hasAnyValue(names) {
  return names.some(hasValue);
}

function hasAllValues(names) {
  return names.every(hasValue);
}

function collectMissing(names) {
  return names.filter((name) => !hasValue(name)).map((name) => name);
}

function boolLine(label, ready, detail) {
  const marker = ready ? "✅" : "⚠️";
  const extra = detail ? ` (${detail})` : "";
  console.log(`${marker} ${label}: ${ready ? "OK" : "MISSING"}${extra}`);
}

let hasError = false;

console.log("ENV check: production readiness");
console.log("--------------------------------");

for (const name of coreRequired) {
  const ready = hasValue(name);
  boolLine(name, ready, ready ? `= ${name === "DATABASE_URL" ? "[present]" : "[set]"}` : "missing");
  if (!ready) hasError = true;
}

if (hasValue("DATABASE_URL") && process.env.DATABASE_URL?.includes("johndoe:randompassword")) {
  boolLine("DATABASE_URL", false, "placeholder-like value detected");
  hasError = true;
}

if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.includes("replace-with")) {
  boolLine("AUTH_SECRET", false, "placeholder-like value detected");
  hasError = true;
}

const googleOAuthReady = hasAllValues(googleOAuthVars);
boolLine(
  "GOOGLE OAuth",
  googleOAuthReady,
  googleOAuthReady ? "client_id + client_secret present" : collectMissing(googleOAuthVars).join(", "),
);

const payosReady = hasAllValues(payosVars);
boolLine(
  "PayOS",
  payosReady,
  payosReady ? "client_id + api_key + checksum present" : collectMissing(payosVars).join(", "),
);

const llmReady = llmVarGroups.some(hasAnyValue);
boolLine("LLM", llmReady, llmReady ? "provider key(s) present" : "GEMINI_* and GROQ_* all missing");

if (!hasError && payosReady && llmReady && googleOAuthReady) {
  console.log("✅ Tất cả nhóm env chính đều có mặt.");
}

if (!googleOAuthReady) {
  console.log("Lưu ý: đường OAuth Google sẽ trả lỗi 'chưa được cấu hình'.");
}

if (!payosReady) {
  console.log("Lưu ý: PayOS sẽ rơi về chế độ demo khi chưa cấu hình đủ 3 biến.");
}

if (!llmReady) {
  console.log("Lưu ý: LLM sẽ fallback khi không có key provider.");
}

process.exit(hasError ? 1 : 0);
