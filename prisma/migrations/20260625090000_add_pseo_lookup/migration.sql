CREATE TYPE "PseoEntityKind" AS ENUM ('MAIN_STAR', 'PALACE', 'SUPPORT_STAR');
CREATE TYPE "PseoPageKind" AS ENUM ('HUB', 'ENTITY', 'COMBINATION');
CREATE TYPE "PseoStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE "PseoEntity" (
  "id" TEXT NOT NULL,
  "kind" "PseoEntityKind" NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "element" TEXT,
  "summary" TEXT NOT NULL,
  "strengths" JSONB,
  "cautions" JSONB,
  "canonicalPath" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PseoEntity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PseoPage" (
  "id" TEXT NOT NULL,
  "kind" "PseoPageKind" NOT NULL,
  "status" "PseoStatus" NOT NULL DEFAULT 'DRAFT',
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "starId" TEXT,
  "palaceId" TEXT,
  "element" TEXT,
  "goodPoints" JSONB,
  "cautionPoints" JSONB,
  "scores" JSONB,
  "faqs" JSONB,
  "focusKeyword" TEXT,
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  "canonicalUrl" TEXT,
  "robots" TEXT NOT NULL DEFAULT 'noindex,follow',
  "auditScore" INTEGER NOT NULL DEFAULT 0,
  "auditFindings" JSONB,
  "generationMeta" JSONB,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PseoPage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PseoEntity_slug_key" ON "PseoEntity"("slug");
CREATE INDEX "PseoEntity_kind_name_idx" ON "PseoEntity"("kind", "name");
CREATE UNIQUE INDEX "PseoPage_slug_key" ON "PseoPage"("slug");
CREATE UNIQUE INDEX "PseoPage_starId_palaceId_key" ON "PseoPage"("starId", "palaceId");
CREATE INDEX "PseoPage_status_kind_updatedAt_idx" ON "PseoPage"("status", "kind", "updatedAt");
CREATE INDEX "PseoPage_starId_status_idx" ON "PseoPage"("starId", "status");
CREATE INDEX "PseoPage_palaceId_status_idx" ON "PseoPage"("palaceId", "status");

ALTER TABLE "PseoPage"
  ADD CONSTRAINT "PseoPage_starId_fkey"
  FOREIGN KEY ("starId") REFERENCES "PseoEntity"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PseoPage"
  ADD CONSTRAINT "PseoPage_palaceId_fkey"
  FOREIGN KEY ("palaceId") REFERENCES "PseoEntity"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
