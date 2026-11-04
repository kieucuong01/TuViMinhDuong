import "server-only";
import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import { defaultQuanEvent, ecosystemTransaction, revokeWishShares } from "@/lib/tu-vi-quan-ecosystem";
import { quanDayKey } from "@/lib/tu-vi-quan-content";
import { QuanSessionError } from "@/lib/tu-vi-quan-session";

export const QUAN_SWITCHES = ["daily", "ritual", "tarot", "iching", "horoscope", "wish", "wish_edit", "event_join", "event_claim", "buy", "share"];
const dayMs = 86_400_000;

export async function readQuanAdminEcosystem(db: PrismaClient, now = new Date()) {
  const today = quanDayKey(now);
  const cutoff = quanDayKey(new Date(now.getTime() - 60 * dayMs));
  const [settings, wishes, events, cohorts, orderStats] = await Promise.all([
    db.quanEcosystemSettings.findUnique({ where: { id: "global" } }),
    db.quanWish.findMany({
      where: { OR: [{ status: "pending" }, { status: { in: ["public", "hidden"] }, reports: { some: {} } }] },
      orderBy: { updatedAt: "desc" }, take: 60,
      select: { id: true, profileId: true, text: true, status: true, profile: { select: { blocked: true } }, _count: { select: { reports: true } } },
    }),
    db.quanEvent.findMany({ where: { endsAt: { gt: now } }, orderBy: { startsAt: "asc" }, take: 12 }),
    db.$queryRaw<Array<{ linked: boolean; visitors: number; activated: number; shared: number; referred: number; referredActivated: number; d1: number; d1Base: number; d7: number; d7Base: number; d30: number; d30Base: number }>>`
      WITH first_visit AS (
        SELECT DISTINCT ON ("profileId") "profileId", "dayKey", "createdAt", linked FROM "QuanMetric"
        WHERE name = 'visit' ORDER BY "profileId", "createdAt"
      ), cohort AS (
        SELECT f.*,
          (EXISTS (SELECT 1 FROM "QuanMetric" e WHERE e."profileId"=f."profileId" AND e.name='daily' AND e."createdAt" BETWEEN f."createdAt" AND f."createdAt" + interval '30 minutes')
           AND EXISTS (SELECT 1 FROM "QuanMetric" e WHERE e."profileId"=f."profileId" AND e.name='ritual' AND e."createdAt" BETWEEN f."createdAt" AND f."createdAt" + interval '30 minutes')) AS activated,
          EXISTS (SELECT 1 FROM "QuanMetric" e WHERE e."profileId"=f."profileId" AND e.name IN ('share_created','share_image')) AS shared,
          EXISTS (SELECT 1 FROM "QuanMetric" e WHERE e."profileId"=f."profileId" AND e.name='share_open' AND e."dayKey"=f."dayKey") AS referred,
          EXISTS (SELECT 1 FROM "QuanMetric" e WHERE e."profileId"=f."profileId" AND e.name='visit' AND e."dayKey"=(f."dayKey"::date+1)::text) AS d1,
          EXISTS (SELECT 1 FROM "QuanMetric" e WHERE e."profileId"=f."profileId" AND e.name='visit' AND e."dayKey"=(f."dayKey"::date+7)::text) AS d7,
          EXISTS (SELECT 1 FROM "QuanMetric" e WHERE e."profileId"=f."profileId" AND e.name='visit' AND e."dayKey"=(f."dayKey"::date+30)::text) AS d30
        FROM first_visit f WHERE f."dayKey" >= ${cutoff}
      ) SELECT linked, count(*)::int AS visitors, count(*) FILTER (WHERE activated)::int AS activated,
        count(*) FILTER (WHERE activated AND shared)::int AS shared,
        count(*) FILTER (WHERE referred)::int AS referred,
        count(*) FILTER (WHERE referred AND activated)::int AS "referredActivated",
        count(*) FILTER (WHERE d1)::int AS d1, count(*) FILTER (WHERE "dayKey"::date+1 <= ${today}::date)::int AS "d1Base",
        count(*) FILTER (WHERE d7)::int AS d7, count(*) FILTER (WHERE "dayKey"::date+7 <= ${today}::date)::int AS "d7Base",
        count(*) FILTER (WHERE d30)::int AS d30, count(*) FILTER (WHERE "dayKey"::date+30 <= ${today}::date)::int AS "d30Base"
      FROM cohort GROUP BY linked`,
    db.quanOrder.groupBy({ by: ["status"], where: { createdAt: { gte: new Date(now.getTime() - 60 * dayMs) } }, _count: { _all: true } }),
  ]);
  return { publicPosting: settings?.publicPosting ?? true, features: settings?.features ?? {}, switches: QUAN_SWITCHES, wishes, events, cohorts,
    defaultEvent: defaultQuanEvent(now, new Set(events.map((event) => event.id))), orderStats };
}

export async function updateQuanAdminEcosystem(db: PrismaClient, adminId: string, body: Record<string, unknown>) {
  const action = body.ecosystemAction;
  const id = typeof body.id === "string" && body.id.length <= 64 ? body.id : "";
  const flag = body.flag;
  const enabled = body.enabled;
  const invalid = () => new QuanSessionError("Thông tin quản trị không hợp lệ.", 400);
  await ecosystemTransaction(db, async (tx) => {
    if (action === "posting" && typeof enabled === "boolean") {
      await tx.quanEcosystemSettings.upsert({ where: { id: "global" }, create: { id: "global", publicPosting: enabled }, update: { publicPosting: enabled } });
    } else if (action === "feature" && typeof flag === "string" && QUAN_SWITCHES.includes(flag) && typeof enabled === "boolean") {
      const row = await tx.quanEcosystemSettings.findUnique({ where: { id: "global" } });
      const features = { ...(row?.features as Record<string, boolean> | undefined), [flag]: enabled };
      await tx.quanEcosystemSettings.upsert({ where: { id: "global" }, create: { id: "global", features }, update: { features } });
    } else if (action === "hide" || action === "keep_private" || action === "approve" || action === "block") {
      const wish = await tx.quanWish.findUnique({ where: { id } });
      if (!wish || wish.status === "deleted") throw invalid();
      if (action === "approve") {
        const [profile, settings] = await Promise.all([
          tx.quanProfile.findUnique({ where: { id: wish.profileId }, select: { blocked: true } }),
          tx.quanEcosystemSettings.findUnique({ where: { id: "global" } }),
        ]);
        if (wish.status !== "pending" || profile?.blocked || settings?.publicPosting === false || !wish.expiresAt || wish.expiresAt <= new Date()) throw invalid();
        await tx.quanWish.update({ where: { id }, data: { status: "public" } });
      } else if (action === "block") {
        await tx.quanProfile.update({ where: { id: wish.profileId }, data: { blocked: true } });
        await tx.quanWish.updateMany({ where: { profileId: wish.profileId, status: { in: ["public", "pending"] } }, data: { status: "hidden" } });
        await tx.quanShare.updateMany({ where: { profileId: wish.profileId, revokedAt: null, snapshot: { path: ["kind"], equals: "wish" } }, data: { revokedAt: new Date() } });
      } else {
        await tx.quanWish.update({ where: { id }, data: { status: action === "hide" ? "hidden" : "restricted" } });
      }
      await revokeWishShares(tx, id, new Date());
      await tx.quanWishReport.deleteMany({ where: { wishId: id } });
    } else if (action === "event") {
      const start = typeof body.startsAt === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(body.startsAt) ? new Date(body.startsAt + ":00+07:00") : null;
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!start || !Number.isFinite(start.getTime()) || start.getTime() <= Date.now() || !title || title.length > 80) throw invalid();
      const eventId = id || randomUUID();
      const endsAt = new Date(start.getTime() + 900_000);
      await tx.quanEvent.upsert({ where: { id: eventId }, create: { id: eventId, title, startsAt: start, endsAt }, update: { title, startsAt: start, endsAt, cancelled: false } });
    } else if (action === "cancel_event" && id) {
      await tx.quanEvent.update({ where: { id }, data: { cancelled: true } });
    } else throw invalid();
    await tx.auditLog.create({ data: { userId: adminId, action: "quan_" + action, entity: "quan_ecosystem", entityId: id || null } });
  });
}
