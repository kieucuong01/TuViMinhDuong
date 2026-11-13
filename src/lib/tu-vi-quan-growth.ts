import "server-only";
import { getDb } from "@/lib/db";
import { quanDayKey } from "@/lib/tu-vi-quan-content";

type Traffic = {
  source: string | null;
  channel: string | null;
  device: string | null;
  day: string | null;
  opened: number;
  entered: number;
  engaged: number;
  started: number;
  checkout: number;
  paid: number;
};

export async function readQuanGrowth(days: 7 | 28, now = new Date()) {
  const db = getDb();
  if (!db) return null;
  const today = quanDayKey(now);
  const firstDay = quanDayKey(new Date(now.getTime() - (days - 1) * 86_400_000));
  const start = new Date(firstDay + "T00:00:00+07:00");
  const cohortStart = quanDayKey(new Date(now.getTime() - 60 * 86_400_000));

  const [traffic, retention, features, steps] = await Promise.all([
    db.$queryRaw<Traffic[]>`
      WITH opens AS (
        SELECT "anonymousSessionId" AS session, source, coalesce(placement, '') AS channel,
          coalesce("resultBand", '') AS device, to_char("createdAt" + interval '7 hours', 'YYYY-MM-DD') AS day
        FROM "FunnelEvent"
        WHERE name = 'quan_open' AND "createdAt" BETWEEN ${start} AND ${now} AND "anonymousSessionId" IS NOT NULL
      ), entries AS (
        SELECT DISTINCT ON (source, "dayKey") source, "dayKey", "profileId", "createdAt"
        FROM "QuanMetric" WHERE name = 'traffic_entry' AND "dayKey" BETWEEN ${firstDay} AND ${today}
        ORDER BY source, "dayKey", "createdAt", "profileId"
      ), visits AS (
        SELECT o.*, e."profileId" AS profile, e."createdAt" AS entry,
          (o.day::date + 1)::timestamp - interval '7 hours' AS midnight
        FROM opens o LEFT JOIN entries e ON e.source = o.session AND e."dayKey" = o.day
      ), journey AS (
        SELECT v.*,
          EXISTS (SELECT 1 FROM "QuanMetric" m WHERE m."profileId" = v.profile AND m."dayKey" = v.day
            AND m."createdAt" >= v.entry AND m.name IN ('daily', 'ritual', 'wish', 'divination', 'share_created')) AS activity,
          EXISTS (SELECT 1 FROM "QuanEncounter" e WHERE e."profileId" = v.profile AND e."startedAt" >= v.entry AND e."startedAt" < v.midnight) AS started,
          orders.checkout, orders.paid
        FROM visits v
        LEFT JOIN LATERAL (
          SELECT count(*) > 0 AS checkout, count(*) FILTER (WHERE o."paidAt" <= ${now}) > 0 AS paid
          FROM "QuanIdentity" i JOIN "QuanOrder" o ON o."ownerId" = i."guestId"
          WHERE i."profileId" = v.profile AND o."createdAt" >= v.entry AND o."createdAt" < v.midnight
        ) orders ON true
      )
      SELECT source, channel, device, day, count(*)::int AS opened,
        count(*) FILTER (WHERE profile IS NOT NULL)::int AS entered,
        count(*) FILTER (WHERE activity OR started)::int AS engaged,
        count(*) FILTER (WHERE started)::int AS started,
        count(*) FILTER (WHERE checkout)::int AS checkout,
        count(*) FILTER (WHERE paid)::int AS paid
      FROM journey GROUP BY GROUPING SETS ((), (source, channel), (device), (day))
      ORDER BY opened DESC
    `,
    db.$queryRaw<{ days: number; eligible: number; returned: number }[]>`
      WITH first_visits AS (
        SELECT "profileId", min("dayKey") AS day FROM "QuanMetric"
        WHERE name = 'visit' AND "dayKey" >= ${cohortStart}
        GROUP BY "profileId"
      )
      SELECT days,
        count(f."profileId") FILTER (WHERE f.day::date + days < ${today}::date)::int AS eligible,
        count(f."profileId") FILTER (WHERE f.day::date + days < ${today}::date AND EXISTS (
          SELECT 1 FROM "QuanMetric" r WHERE r."profileId" = f."profileId" AND r.name = 'visit' AND r."dayKey" = (f.day::date + days)::text
        ))::int AS returned
      FROM (VALUES (1), (7), (30)) AS periods(days)
      LEFT JOIN first_visits f ON NOT EXISTS (
        SELECT 1 FROM "QuanMetric" p WHERE p."profileId" = f."profileId" AND p.name = 'visit' AND p."dayKey" < f.day
      )
      GROUP BY days ORDER BY days
    `,
    db.$queryRaw<{ name: string; people: number }[]>`
      SELECT name, count(DISTINCT "profileId")::int AS people FROM "QuanMetric"
      WHERE name IN ('daily', 'ritual', 'wish', 'divination', 'share_created', 'share_image', 'profile_saved')
        AND "dayKey" BETWEEN ${firstDay} AND ${today}
      GROUP BY name ORDER BY people DESC, name
    `,
    db.$queryRaw<{ step: string; visits: number }[]>`
      SELECT s.placement AS step, count(*)::int AS visits
      FROM "FunnelEvent" s
      WHERE s.name = 'quan_step' AND s."createdAt" BETWEEN ${start} AND ${now}
        AND EXISTS (
          SELECT 1 FROM "FunnelEvent" o WHERE o."dedupeKey" =
            'quan-open:' || s."anonymousSessionId" || ':' || to_char(s."createdAt" + interval '7 hours', 'YYYY-MM-DD')
        )
      GROUP BY s.placement
    `,
  ]);
  return { traffic, retention, features, steps };
}
