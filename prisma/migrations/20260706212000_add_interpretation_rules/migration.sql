CREATE TABLE "InterpretationRule" (
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "pattern" JSONB NOT NULL,
    "priority" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "strengthText" TEXT NOT NULL,
    "cautionText" TEXT NOT NULL,
    "lifeAdviceText" TEXT NOT NULL,
    "teaserQuestion" TEXT NOT NULL,
    "evidenceLabel" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterpretationRule_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "InterpretationRule_scope_status_priority_idx" ON "InterpretationRule"("scope", "status", "priority");
CREATE INDEX "InterpretationRule_version_status_idx" ON "InterpretationRule"("version", "status");
