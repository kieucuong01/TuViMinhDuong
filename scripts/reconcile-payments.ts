import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import {
  createPayOSReconciliationFetcher,
  parsePaymentReconciliationArgs,
  reconcileStalePaymentOrders,
  type PaymentReconciliationDb,
} from "../src/lib/payment-reconciliation.ts";

const databaseUrl = process.env.DATABASE_URL?.trim();
const clientId = process.env.PAYOS_CLIENT_ID?.trim();
const apiKey = process.env.PAYOS_API_KEY?.trim();

if (!databaseUrl) throw new Error("DATABASE_URL is required for payment reconciliation");
if (!clientId || !apiKey) throw new Error("PAYOS_CLIENT_ID and PAYOS_API_KEY are required for payment reconciliation");

const cli = parsePaymentReconciliationArgs(process.argv.slice(2));
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

try {
  const summary = await reconcileStalePaymentOrders({
    db: prisma as unknown as PaymentReconciliationDb,
    ...cli,
    fetchPaymentRequest: createPayOSReconciliationFetcher({ clientId, apiKey }),
  });
  console.log(JSON.stringify(summary, null, 2));
  if (summary.providerErrors || summary.mismatches || summary.paidObserved) process.exitCode = 2;
} finally {
  await prisma.$disconnect();
}
