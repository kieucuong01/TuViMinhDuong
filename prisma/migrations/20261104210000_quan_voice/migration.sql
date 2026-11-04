-- AlterTable
ALTER TABLE "QuanOrder" ADD COLUMN     "readingKind" TEXT NOT NULL DEFAULT 'tuvi';

-- CreateTable
CREATE TABLE "QuanEncounter" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "freeDay" TEXT,
    "orderId" TEXT,
    "state" TEXT NOT NULL DEFAULT 'waiting',
    "context" JSONB NOT NULL,
    "queuedAt" TIMESTAMP(3),
    "inviteExpiresAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "outageSince" TIMESTAMP(3),
    "speakingUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuanEncounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuanEncounterTurn" (
    "encounterId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "state" TEXT NOT NULL DEFAULT 'pending',
    "interrupted" BOOLEAN NOT NULL DEFAULT false,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuanEncounterTurn_pkey" PRIMARY KEY ("encounterId","id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuanEncounter_orderId_key" ON "QuanEncounter"("orderId");

-- CreateIndex
CREATE INDEX "QuanEncounter_state_queuedAt_idx" ON "QuanEncounter"("state", "queuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuanEncounter_profileId_freeDay_key" ON "QuanEncounter"("profileId", "freeDay");

-- CreateIndex
CREATE INDEX "QuanEncounterTurn_encounterId_createdAt_idx" ON "QuanEncounterTurn"("encounterId", "createdAt");

-- AddForeignKey
ALTER TABLE "QuanEncounter" ADD CONSTRAINT "QuanEncounter_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "QuanProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuanEncounter" ADD CONSTRAINT "QuanEncounter_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "QuanOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuanEncounterTurn" ADD CONSTRAINT "QuanEncounterTurn_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "QuanEncounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
