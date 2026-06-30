ALTER TABLE "Chart" ADD COLUMN "creationIp" TEXT;
ALTER TABLE "Chart" ADD COLUMN "creationUserAgent" TEXT;

CREATE INDEX "Chart_creationIp_createdAt_idx" ON "Chart"("creationIp", "createdAt");
