CREATE TABLE "PaymentReconciliationRun" (
    "id" TEXT NOT NULL,
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "olderThanHours" INTEGER NOT NULL,
    "scanned" INTEGER NOT NULL,
    "updated" INTEGER NOT NULL,
    "unchanged" INTEGER NOT NULL,
    "cancelled" INTEGER NOT NULL,
    "expired" INTEGER NOT NULL,
    "failed" INTEGER NOT NULL,
    "paidObserved" INTEGER NOT NULL,
    "mismatches" INTEGER NOT NULL,
    "providerErrors" INTEGER NOT NULL,
    "concurrentChanges" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentReconciliationRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaymentReconciliationRun_createdAt_idx" ON "PaymentReconciliationRun"("createdAt");
