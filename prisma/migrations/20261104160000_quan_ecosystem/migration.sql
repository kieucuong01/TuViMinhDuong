-- Additive ecosystem tables; existing orders and chart engine are unchanged.

CREATE TABLE "QuanProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "alias" TEXT NOT NULL,
    "birthInput" JSONB,
    "equipped" JSONB NOT NULL DEFAULT '{}',
    "recoveryDigest" TEXT,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuanProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuanIdentity" (
    "guestId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "QuanIdentity_pkey" PRIMARY KEY ("guestId")
);

CREATE TABLE "QuanEntry" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB NOT NULL,
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuanEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuanItem" (
    "profileId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuanItem_pkey" PRIMARY KEY ("profileId","itemId")
);

CREATE TABLE "QuanWish" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "placement" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'private',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuanWish_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuanWishReaction" (
    "wishId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,

    CONSTRAINT "QuanWishReaction_pkey" PRIMARY KEY ("wishId","profileId","kind")
);

CREATE TABLE "QuanWishReport" (
    "wishId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuanWishReport_pkey" PRIMARY KEY ("wishId","profileId")
);

CREATE TABLE "QuanEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QuanEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuanShare" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuanShare_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuanMetric" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'direct',
    "linked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuanMetric_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuanEcosystemSettings" (
    "id" TEXT NOT NULL,
    "publicPosting" BOOLEAN NOT NULL DEFAULT true,
    "features" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "QuanEcosystemSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuanProfile_userId_key" ON "QuanProfile"("userId");

CREATE UNIQUE INDEX "QuanProfile_recoveryDigest_key" ON "QuanProfile"("recoveryDigest");

CREATE INDEX "QuanIdentity_profileId_idx" ON "QuanIdentity"("profileId");

CREATE INDEX "QuanEntry_profileId_createdAt_idx" ON "QuanEntry"("profileId", "createdAt");

CREATE UNIQUE INDEX "QuanEntry_profileId_kind_dayKey_key" ON "QuanEntry"("profileId", "kind", "dayKey");

CREATE INDEX "QuanWish_status_expiresAt_createdAt_idx" ON "QuanWish"("status", "expiresAt", "createdAt");

CREATE INDEX "QuanWish_profileId_createdAt_idx" ON "QuanWish"("profileId", "createdAt");

CREATE UNIQUE INDEX "QuanWishReport_wishId_userId_key" ON "QuanWishReport"("wishId", "userId");

CREATE INDEX "QuanEvent_startsAt_endsAt_idx" ON "QuanEvent"("startsAt", "endsAt");

CREATE INDEX "QuanShare_profileId_createdAt_idx" ON "QuanShare"("profileId", "createdAt");

CREATE INDEX "QuanMetric_name_dayKey_idx" ON "QuanMetric"("name", "dayKey");

CREATE UNIQUE INDEX "QuanMetric_profileId_name_dayKey_key" ON "QuanMetric"("profileId", "name", "dayKey");

ALTER TABLE "QuanProfile" ADD CONSTRAINT "QuanProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QuanIdentity" ADD CONSTRAINT "QuanIdentity_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "QuanProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuanEntry" ADD CONSTRAINT "QuanEntry_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "QuanProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuanItem" ADD CONSTRAINT "QuanItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "QuanProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuanWish" ADD CONSTRAINT "QuanWish_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "QuanProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuanWishReaction" ADD CONSTRAINT "QuanWishReaction_wishId_fkey" FOREIGN KEY ("wishId") REFERENCES "QuanWish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuanWishReaction" ADD CONSTRAINT "QuanWishReaction_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "QuanProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuanWishReport" ADD CONSTRAINT "QuanWishReport_wishId_fkey" FOREIGN KEY ("wishId") REFERENCES "QuanWish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuanWishReport" ADD CONSTRAINT "QuanWishReport_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "QuanProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuanShare" ADD CONSTRAINT "QuanShare_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "QuanProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuanMetric" ADD CONSTRAINT "QuanMetric_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "QuanProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
