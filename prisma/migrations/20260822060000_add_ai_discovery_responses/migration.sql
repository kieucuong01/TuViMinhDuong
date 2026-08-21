-- Store one optional, privacy-bounded acquisition response after a chart is created.
-- The chart/session authorization is enforced by the application before writing.
CREATE TABLE "AiDiscoveryResponse" (
    "id" TEXT NOT NULL,
    "chartId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "aiPlatform" TEXT,
    "prompt" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiDiscoveryResponse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AiDiscoveryResponse_chartId_key" ON "AiDiscoveryResponse"("chartId");
CREATE INDEX "AiDiscoveryResponse_source_createdAt_idx" ON "AiDiscoveryResponse"("source", "createdAt");
CREATE INDEX "AiDiscoveryResponse_aiPlatform_createdAt_idx" ON "AiDiscoveryResponse"("aiPlatform", "createdAt");

ALTER TABLE "AiDiscoveryResponse" ADD CONSTRAINT "AiDiscoveryResponse_chartId_fkey"
  FOREIGN KEY ("chartId") REFERENCES "Chart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
