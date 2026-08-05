-- Add a bounded attribution snapshot to orders. It contains categorical source,
-- landing class, tool and placement only; never raw URLs or contact data.
ALTER TABLE "PaymentOrder" ADD COLUMN "attribution" JSONB;

CREATE TABLE "FunnelEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "anonymousSessionId" TEXT,
    "userId" TEXT,
    "chartId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'unknown',
    "landingClass" TEXT NOT NULL DEFAULT 'other',
    "tool" TEXT NOT NULL DEFAULT 'other',
    "placement" TEXT,
    "resultBand" TEXT,
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FunnelEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FunnelEvent_dedupeKey_key" ON "FunnelEvent"("dedupeKey");
CREATE INDEX "FunnelEvent_createdAt_idx" ON "FunnelEvent"("createdAt");
CREATE INDEX "FunnelEvent_name_createdAt_idx" ON "FunnelEvent"("name", "createdAt");
CREATE INDEX "FunnelEvent_source_createdAt_idx" ON "FunnelEvent"("source", "createdAt");
CREATE INDEX "FunnelEvent_tool_createdAt_idx" ON "FunnelEvent"("tool", "createdAt");
CREATE INDEX "FunnelEvent_userId_createdAt_idx" ON "FunnelEvent"("userId", "createdAt");
CREATE INDEX "FunnelEvent_chartId_createdAt_idx" ON "FunnelEvent"("chartId", "createdAt");

ALTER TABLE "FunnelEvent" ADD CONSTRAINT "FunnelEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FunnelEvent" ADD CONSTRAINT "FunnelEvent_chartId_fkey"
  FOREIGN KEY ("chartId") REFERENCES "Chart"("id") ON DELETE SET NULL ON UPDATE CASCADE;
