ALTER TABLE "Chart" ADD COLUMN "creationSource" TEXT;
ALTER TABLE "Chart" ADD COLUMN "creationAttribution" JSONB;

CREATE INDEX "Chart_creationSource_createdAt_idx" ON "Chart"("creationSource", "createdAt");
