import "dotenv/config";

import { createHmac, randomUUID } from "node:crypto";
import pg from "pg";

const { Client } = pg;

const packages = {
  starter: { key: "starter", label: "Gói khởi đầu", coins: 99, bonusCoins: 0, priceVnd: 99000 },
  "full-reading": { key: "full-reading", label: "Gói luận toàn bộ", coins: 199, bonusCoins: 10, priceVnd: 199000 },
  pro: { key: "pro", label: "Gói chuyên sâu", coins: 499, bonusCoins: 60, priceVnd: 499000 },
};

function argValue(name, fallback = undefined) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  return process.argv[index + 1] || fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function appUrl() {
  return (argValue("app-url") || process.env.NEXT_PUBLIC_APP_URL || "https://tu-vi-minh-duong.vercel.app").replace(/\/$/, "");
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for PayOS smoke.`);
  return value;
}

function sortedQuery(data) {
  return Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join("&");
}

function signPayOSData(data) {
  return createHmac("sha256", requireEnv("PAYOS_CHECKSUM_KEY")).update(sortedQuery(data)).digest("hex");
}

function orderCode() {
  return Number(`${Date.now()}${Math.floor(Math.random() * 90 + 10)}`.slice(-12));
}

function id(prefix) {
  return `${prefix}_${randomUUID().replaceAll("-", "")}`;
}

function redactUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return value;
  }
}

function printJson(payload) {
  console.log(JSON.stringify(payload, null, 2));
}

async function connectDb() {
  const databaseUrl = requireEnv("DATABASE_URL");
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  return client;
}

async function ensureSmokeUser(client, email) {
  const result = await client.query(
    `INSERT INTO "User" ("id", "email", "name", "coinBalance", "role", "createdAt", "updatedAt")
     VALUES ($1, $2, 'PayOS Smoke', 0, 'USER', now(), now())
     ON CONFLICT ("email") DO UPDATE SET "updatedAt" = now()
     RETURNING "id", "email", "coinBalance"`,
    [id("smoke_user"), email],
  );
  return result.rows[0];
}

async function ensurePackage(client, pack) {
  const result = await client.query(
    `INSERT INTO "CoinPackage" ("id", "key", "label", "coins", "bonusCoins", "priceVnd", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, true, now(), now())
     ON CONFLICT ("key") DO UPDATE SET
       "label" = EXCLUDED."label",
       "coins" = EXCLUDED."coins",
       "bonusCoins" = EXCLUDED."bonusCoins",
       "priceVnd" = EXCLUDED."priceVnd",
       "isActive" = true,
       "updatedAt" = now()
     RETURNING "id", "key", "coins", "bonusCoins", "priceVnd"`,
    [id("smoke_pkg"), pack.key, pack.label, pack.coins, pack.bonusCoins, pack.priceVnd],
  );
  return result.rows[0];
}

async function createCheckout() {
  requireEnv("PAYOS_CLIENT_ID");
  requireEnv("PAYOS_API_KEY");
  requireEnv("PAYOS_CHECKSUM_KEY");

  const client = await connectDb();
  const pack = packages[argValue("package", "full-reading")] || packages["full-reading"];
  const totalCoins = pack.coins + pack.bonusCoins;
  const code = Number(argValue("order-code")) || orderCode();
  const baseUrl = appUrl();
  const returnPath = argValue("return-path", "/nap-xu");
  const joiner = returnPath.includes("?") ? "&" : "?";
  const returnUrl = `${baseUrl}${returnPath}${joiner}status=success&orderCode=${code}`;
  const cancelUrl = `${baseUrl}${returnPath}${joiner}status=cancelled&orderCode=${code}`;
  const email = (argValue("email") || `payos-smoke-${code}@lasotinhhoa.local`).toLowerCase();
  const amount = Number(argValue("amount-vnd")) || pack.priceVnd;
  const body = {
    orderCode: code,
    amount,
    description: `Nap ${totalCoins} xu`,
    buyerName: "PayOS Smoke",
    buyerEmail: email,
    returnUrl,
    cancelUrl,
    items: [{ name: pack.label, quantity: 1, price: amount }],
  };
  const signature = signPayOSData({
    amount: body.amount,
    cancelUrl: body.cancelUrl,
    description: body.description,
    orderCode: body.orderCode,
    returnUrl: body.returnUrl,
  });

  try {
    const response = await fetch("https://api-merchant.payos.vn/v2/payment-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.PAYOS_CLIENT_ID || "",
        "x-api-key": process.env.PAYOS_API_KEY || "",
      },
      body: JSON.stringify({ ...body, signature }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || json.code !== "00") {
      throw new Error(`PayOS create checkout failed: ${response.status} ${json.desc || json.message || "unknown"}`);
    }

    const user = await ensureSmokeUser(client, email);
    const packageRecord = await ensurePackage(client, pack);
    await client.query(
      `INSERT INTO "PaymentOrder" (
        "id", "userId", "packageId", "orderCode", "paymentLinkId", "amountVnd", "coins",
        "status", "checkoutUrl", "rawPayload", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8, $9::jsonb, now(), now())
      ON CONFLICT ("orderCode") DO UPDATE SET
        "paymentLinkId" = EXCLUDED."paymentLinkId",
        "checkoutUrl" = EXCLUDED."checkoutUrl",
        "rawPayload" = EXCLUDED."rawPayload",
        "updatedAt" = now()`,
      [
        id("smoke_order"),
        user.id,
        packageRecord.id,
        BigInt(code),
        json.data?.paymentLinkId || null,
        amount,
        totalCoins,
        json.data?.checkoutUrl || null,
        JSON.stringify({ raw: json, smoke: true, appUrl: baseUrl, packageKey: pack.key }),
      ],
    );

    printJson({
      ok: true,
      mode: "create",
      appUrl: baseUrl,
      webhookUrl: `${baseUrl}/api/webhooks/payos`,
      orderCode: String(code),
      packageKey: pack.key,
      amountVnd: amount,
      coins: totalCoins,
      userEmail: email,
      checkoutUrl: json.data?.checkoutUrl,
      paymentLinkId: json.data?.paymentLinkId,
      next: [
        "Open checkoutUrl and complete PayOS sandbox/production payment.",
        `Run: npm run smoke:payos -- inspect --order-code ${code}`,
        "Confirm status=PAID and ledgerCredit.amount equals coins.",
      ],
    });
  } finally {
    await client.end();
  }
}

async function inspectOrder() {
  const code = argValue("order-code");
  if (!code) throw new Error("--order-code is required.");
  const client = await connectDb();
  try {
    const orderResult = await client.query(
      `SELECT po."id", po."orderCode", po."paymentLinkId", po."amountVnd", po."coins", po."status",
              po."checkoutUrl", po."paidAt", po."createdAt", po."updatedAt",
              u."email", u."coinBalance"
       FROM "PaymentOrder" po
       JOIN "User" u ON u."id" = po."userId"
       WHERE po."orderCode" = $1`,
      [BigInt(code)],
    );
    const order = orderResult.rows[0];
    if (!order) {
      printJson({ ok: false, mode: "inspect", orderCode: String(code), error: "ORDER_NOT_FOUND" });
      process.exitCode = 1;
      return;
    }

    const ledgerResult = await client.query(
      `SELECT "type", "amount", "balance", "reason", "referenceId", "createdAt"
       FROM "CoinLedger"
       WHERE "referenceId" = $1
       ORDER BY "createdAt" ASC`,
      [order.id],
    );
    const creditTotal = ledgerResult.rows
      .filter((row) => row.type === "CREDIT")
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);

    printJson({
      ok: true,
      mode: "inspect",
      orderCode: String(order.orderCode),
      status: order.status,
      paidAt: order.paidAt,
      amountVnd: order.amountVnd,
      coins: order.coins,
      userEmail: order.email,
      userCoinBalance: order.coinBalance,
      checkoutUrl: hasFlag("show-url") ? order.checkoutUrl : redactUrl(order.checkoutUrl),
      ledgerCredit: {
        count: ledgerResult.rows.filter((row) => row.type === "CREDIT").length,
        amount: creditTotal,
        expectedAmount: Number(order.coins),
        idempotent: ledgerResult.rows.filter((row) => row.type === "CREDIT").length <= 1,
      },
      ledgers: ledgerResult.rows,
      checks: {
        paid: order.status === "PAID",
        creditedExactCoins: order.status === "PAID" ? creditTotal === Number(order.coins) : creditTotal === 0,
        duplicateWebhookDidNotDoubleCredit: ledgerResult.rows.filter((row) => row.type === "CREDIT").length <= 1,
      },
    });
  } finally {
    await client.end();
  }
}

function printUsage() {
  console.log(`Usage:
  npm run smoke:payos -- create [--package full-reading] [--email test@example.com] [--app-url https://tu-vi-minh-duong.vercel.app]
  npm run smoke:payos -- inspect --order-code 123456789012

Notes:
  - create requires DATABASE_URL, PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY.
  - PayOS webhook must point to <app-url>/api/webhooks/payos.
  - inspect prints checkoutUrl redacted unless --show-url is passed.`);
}

const command = process.argv[2];

try {
  if (command === "create") await createCheckout();
  else if (command === "inspect") await inspectOrder();
  else printUsage();
} catch (error) {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
}
