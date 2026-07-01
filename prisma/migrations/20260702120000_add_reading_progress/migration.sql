CREATE TABLE "ReadingProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readingId" TEXT NOT NULL,
    "chapterKey" TEXT NOT NULL,
    "chapterIndex" INTEGER NOT NULL,
    "percent" INTEGER NOT NULL,
    "chapterOffset" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReadingProgress_userId_readingId_key"
ON "ReadingProgress"("userId", "readingId");

CREATE INDEX "ReadingProgress_readingId_idx"
ON "ReadingProgress"("readingId");

ALTER TABLE "ReadingProgress"
ADD CONSTRAINT "ReadingProgress_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReadingProgress"
ADD CONSTRAINT "ReadingProgress_readingId_fkey"
FOREIGN KEY ("readingId") REFERENCES "Reading"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
