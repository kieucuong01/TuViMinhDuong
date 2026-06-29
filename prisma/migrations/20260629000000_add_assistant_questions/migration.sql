CREATE TABLE "AssistantQuestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chartId" TEXT NOT NULL,
    "readingId" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantQuestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssistantQuestion_userId_chartId_slot_key"
ON "AssistantQuestion"("userId", "chartId", "slot");

CREATE INDEX "AssistantQuestion_userId_chartId_createdAt_idx"
ON "AssistantQuestion"("userId", "chartId", "createdAt");

ALTER TABLE "AssistantQuestion"
ADD CONSTRAINT "AssistantQuestion_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssistantQuestion"
ADD CONSTRAINT "AssistantQuestion_chartId_fkey"
FOREIGN KEY ("chartId") REFERENCES "Chart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssistantQuestion"
ADD CONSTRAINT "AssistantQuestion_readingId_fkey"
FOREIGN KEY ("readingId") REFERENCES "Reading"("id") ON DELETE CASCADE ON UPDATE CASCADE;
