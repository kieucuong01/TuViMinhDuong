CREATE TYPE "QuanOrderStatus" AS ENUM ('PENDING', 'PAID', 'QUEUED', 'INVITED', 'ACTIVE', 'ENDED', 'REFUND', 'CANCELLED');

CREATE TABLE "QuanOrder" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "recoveryDigest" TEXT NOT NULL,
    "orderCode" BIGINT NOT NULL,
    "paymentLinkId" TEXT,
    "checkoutUrl" TEXT,
    "qrCode" TEXT,
    "amountVnd" INTEGER NOT NULL,
    "minutes" INTEGER NOT NULL,
    "chart" JSONB NOT NULL,
    "status" "QuanOrderStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "checkedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "queuedAt" TIMESTAMP(3),
    "inviteExpiresAt" TIMESTAMP(3),
    "tableNumber" INTEGER,
    "startedAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "outageSince" TIMESTAMP(3),
    "refundAmountVnd" INTEGER,
    "refundSettledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuanOrder_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "QuanOrder_package_check" CHECK (("minutes" = 15 AND "amountVnd" = 100000) OR ("minutes" = 30 AND "amountVnd" = 200000)),
    CONSTRAINT "QuanOrder_table_check" CHECK ("tableNumber" BETWEEN 1 AND 3)
);

CREATE TABLE "QuanTurn" (
    "orderId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "state" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuanTurn_pkey" PRIMARY KEY ("orderId", "id"),
    CONSTRAINT "QuanTurn_state_check" CHECK ("state" IN ('pending', 'answered', 'failed'))
);

CREATE TABLE "QuanSettings" (
    "id" TEXT NOT NULL,
    "maxTables" INTEGER NOT NULL DEFAULT 3,
    CONSTRAINT "QuanSettings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "QuanSettings_capacity_check" CHECK ("maxTables" BETWEEN 0 AND 3)
);

CREATE UNIQUE INDEX "QuanOrder_recoveryDigest_key" ON "QuanOrder"("recoveryDigest");
CREATE UNIQUE INDEX "QuanOrder_orderCode_key" ON "QuanOrder"("orderCode");
CREATE UNIQUE INDEX "QuanOrder_paymentLinkId_key" ON "QuanOrder"("paymentLinkId");
CREATE INDEX "QuanOrder_ownerId_createdAt_idx" ON "QuanOrder"("ownerId", "createdAt");
CREATE INDEX "QuanOrder_status_queuedAt_idx" ON "QuanOrder"("status", "queuedAt");
CREATE UNIQUE INDEX "QuanOrder_active_table_key" ON "QuanOrder"("tableNumber") WHERE "status" IN ('INVITED', 'ACTIVE');
CREATE INDEX "QuanTurn_orderId_state_idx" ON "QuanTurn"("orderId", "state");
ALTER TABLE "QuanTurn" ADD CONSTRAINT "QuanTurn_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "QuanOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
