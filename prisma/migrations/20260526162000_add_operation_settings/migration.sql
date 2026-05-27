CREATE TABLE "OperationSettings" (
  "id" TEXT NOT NULL DEFAULT 'global',
  "paymentsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "coinTopupEnabled" BOOLEAN NOT NULL DEFAULT true,
  "paidReadingsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OperationSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "OperationSettings" ("id", "paymentsEnabled", "coinTopupEnabled", "paidReadingsEnabled")
VALUES ('global', true, true, true)
ON CONFLICT ("id") DO NOTHING;
