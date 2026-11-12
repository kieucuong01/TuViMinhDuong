import "server-only";
import { getDb } from "@/lib/db";
import { quanDayKey } from "@/lib/tu-vi-quan-content";

type ReportRow = {
  day: string | null;
  visitors: number;
  activeVisitors: number;
  freeSessions: number;
  paidSessions: number;
  orders: number;
  convertedOrders: number;
  paidOrders: number;
  revenue: number;
};

export async function readQuanReport(days: 7 | 28, now = new Date()) {
  const db = getDb();
  if (!db) return null;

  const today = quanDayKey(now);
  const firstDay = quanDayKey(new Date(now.getTime() - (days - 1) * 86_400_000));
  const start = new Date(firstDay + "T00:00:00+07:00");
  const rows = await db.$queryRaw<ReportRow[]>`
    WITH activity AS (
      SELECT "dayKey" AS day, "profileId" AS visitor, name AS kind, 0 AS amount
      FROM "QuanMetric"
      WHERE name IN ('visit', 'daily', 'ritual', 'wish', 'divination', 'share_created')
        AND "dayKey" BETWEEN ${firstDay} AND ${today}
      UNION ALL
      SELECT to_char("startedAt" + interval '7 hours', 'YYYY-MM-DD'), "profileId",
        CASE WHEN "orderId" IS NULL THEN 'free_session' ELSE 'paid_session' END, 0
      FROM "QuanEncounter"
      WHERE "startedAt" BETWEEN ${start} AND ${now}
      UNION ALL
      SELECT to_char("createdAt" + interval '7 hours', 'YYYY-MM-DD'), NULL,
        CASE WHEN "paidAt" <= ${now} THEN 'converted_order' ELSE 'order' END, 0
      FROM "QuanOrder" WHERE "createdAt" BETWEEN ${start} AND ${now}
      UNION ALL
      SELECT to_char("paidAt" + interval '7 hours', 'YYYY-MM-DD'), NULL, 'payment', "amountVnd"
      FROM "QuanOrder" WHERE "paidAt" BETWEEN ${start} AND ${now}
    )
    SELECT day,
      count(DISTINCT visitor) FILTER (WHERE kind = 'visit')::int AS visitors,
      count(DISTINCT visitor) FILTER (WHERE kind NOT IN ('visit', 'order', 'converted_order', 'payment'))::int AS "activeVisitors",
      count(*) FILTER (WHERE kind = 'free_session')::int AS "freeSessions",
      count(*) FILTER (WHERE kind = 'paid_session')::int AS "paidSessions",
      count(*) FILTER (WHERE kind IN ('order', 'converted_order'))::int AS orders,
      count(*) FILTER (WHERE kind = 'converted_order')::int AS "convertedOrders",
      count(*) FILTER (WHERE kind = 'payment')::int AS "paidOrders",
      coalesce(sum(amount), 0)::float8 AS revenue
    FROM activity GROUP BY GROUPING SETS ((day), ()) ORDER BY day DESC NULLS FIRST
  `;

  const [totals, ...byDay] = rows;
  const daily = Array.from({ length: days }, (_, index) => {
    const day = quanDayKey(new Date(now.getTime() - index * 86_400_000));
    return { ...byDay.find((row) => row.day === day), day };
  });
  return { totals, daily };
}
