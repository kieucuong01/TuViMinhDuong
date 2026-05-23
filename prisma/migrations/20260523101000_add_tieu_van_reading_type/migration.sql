ALTER TYPE "ReadingType" ADD VALUE IF NOT EXISTS 'TIEU_VAN';

INSERT INTO "FeaturePrice" ("key", "label", "priceCoins", "isActive", "updatedAt")
VALUES ('TIEU_VAN', 'Luận tiểu vận', 39, true, NOW())
ON CONFLICT ("key") DO UPDATE
SET "label" = EXCLUDED."label",
    "priceCoins" = EXCLUDED."priceCoins",
    "isActive" = true,
    "updatedAt" = NOW();
