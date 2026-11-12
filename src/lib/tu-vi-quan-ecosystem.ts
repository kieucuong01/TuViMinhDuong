import "server-only";
import { quanRemainingMs } from "@/lib/tu-vi-quan-time";
import { createHash, randomBytes, randomInt } from "node:crypto";
import { Prisma, type PrismaClient, type QuanProfile } from "@/generated/prisma/client";
import { generateTuViChart, type ChartInput, type TuViChart } from "@/lib/chart";
import { analyzeDate } from "@/lib/date-fortune";
import { solarToLunar } from "@/lib/lunar";
import type { QuanGuest } from "@/lib/tu-vi-quan-guest";
import { normalizeQuanAlias } from "@/lib/tu-vi-quan-guest";
import { QuanSessionError, readQuanChart } from "@/lib/tu-vi-quan-session";
import { mutateMonastery, readMonastery } from "@/lib/tu-vi-quan-monastery";
import { requireQuanMonasterySeat } from "@/lib/tu-vi-quan-seat";
import {
  QUAN_CONTENT_VERSION, QUAN_DAILY_VERSION, QUAN_COSMETICS, drawDaily, drawTarot, drawIChing,
  moderateWish, quanDayKey, buildQuanHoroscope,
} from "@/lib/tu-vi-quan-content";

type Tx = Prisma.TransactionClient;
type Actor = { guest: QuanGuest; userId?: string };
type Bag = Record<string, unknown>;
const DAY = 86_400_000;
const TTL = 30 * DAY;
const pointActivities = ["daily", "incense", "meditate", "check_in", "chant", "monastery_meditate", "monastery_chant", "monastery_garden"];
const levels = [
  { title: "Sơ nhập môn", threshold: 0 },
  { title: "Bạn quen của quán", threshold: 100 },
  { title: "Người giữ đèn", threshold: 300 },
  { title: "Bạn đồng hành", threshold: 700 },
  { title: "Đại sư phong thủy", threshold: 1500 },
];
const CALLIGRAPHY = {
  calm: [["An", "Dành mười phút cho việc giúp bạn thấy nhẹ lòng."], ["Bền", "Làm tiếp một việc nhỏ mà bạn đã bắt đầu."], ["Sáng", "Viết rõ điều bạn biết và điều còn phải hỏi."], ["Tĩnh", "Cho mình một nhịp thở trước khi trả lời."]],
  playful: [["Gọn", "Dọn một tab trình duyệt. Ba mươi tab còn lại xin hẹn mai."], ["Nghỉ", "Deadline biết chạy. Mình biết đi lấy nước."], ["Thảnh", "Hôm nay cho phép trả lời tin nhắn sau khi ăn xong."], ["Bớt", "Bớt ôm việc để còn hai tay ôm gối."]],
} as const;
const asBag = (value: unknown): Bag => value && typeof value === "object" && !Array.isArray(value) ? value as Bag : {};
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const digest = (code: string) => createHash("sha256").update("quan-profile:" + code).digest("hex");
function fail(message: string, status = 400): never { throw new QuanSessionError(message, status); }
const str = (value: unknown, max = 100) => typeof value === "string" && value.length <= max ? value : fail("Nội dung không hợp lệ.");
const metricNames = new Set(["visit", "daily", "ritual", "profile_saved", "divination", "wish", "reaction", "share_created", "share_open", "share_image", "checkout", "paid", "session_started"]);

export function quanEcosystemEnabled() {
  return process.env.TU_VI_QUAN_ECOSYSTEM_ENABLED === "true" ||
    (process.env.NODE_ENV !== "production" && process.env.TU_VI_QUAN_ECOSYSTEM_ENABLED !== "false");
}

export function ecosystemTransaction<T>(db: PrismaClient, run: (tx: Tx) => Promise<T>) {
  return db.$transaction(async (tx) => {
    // shortcut: one short global lock; shard by profile with ordered merge locks if write throughput grows.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(1988110402)::text`;
    return run(tx);
  }, { maxWait: 15_000, timeout: 20_000 });
}

export async function ensureProfile(tx: Tx, actor: Actor) {
  const identity = await tx.quanIdentity.findUnique({ where: { guestId: actor.guest.id }, include: { profile: true } });
  if (identity) {
    if (identity.profile.userId && identity.profile.userId !== actor.userId) fail("Đăng nhập tài khoản đã liên kết để mở sổ của bạn.", 401);
    return identity.profile;
  }
  return tx.quanProfile.create({ data: { alias: actor.guest.alias, identities: { create: { guestId: actor.guest.id } } } });
}

async function entry(tx: Tx, profileId: string, kind: string, dayKey: string, data: unknown, points = 0, now = new Date(), version = QUAN_CONTENT_VERSION) {
  return tx.quanEntry.upsert({
    where: { profileId_kind_dayKey: { profileId, kind, dayKey } }, update: {},
    create: { profileId, kind, dayKey, data: json(data), points, version, createdAt: now },
  });
}

async function metric(tx: Tx, profile: QuanProfile, name: string, now: Date, source = "direct") {
  if (!metricNames.has(name)) fail("Sự kiện không hợp lệ.");
  return tx.quanMetric.upsert({
    where: { profileId_name_dayKey: { profileId: profile.id, name, dayKey: quanDayKey(now) } }, update: {},
    create: { profileId: profile.id, name, dayKey: quanDayKey(now), linked: Boolean(profile.userId), source, createdAt: now },
  });
}

export async function saveQuanBirth(tx: Tx, profile: QuanProfile, chart: TuViChart | null, now: Date) {
  const updated = await tx.quanProfile.update({
    where: { id: profile.id },
    data: { birthInput: chart ? json(chart.input) : Prisma.DbNull },
  });
  await metric(tx, updated, "profile_saved", now);
  return updated;
}

async function totals(tx: Tx, id: string) {
  const [balance, earned] = await Promise.all([
    tx.quanEntry.aggregate({ where: { profileId: id }, _sum: { points: true } }),
    tx.quanEntry.aggregate({ where: { profileId: id, points: { gt: 0 }, kind: { in: pointActivities } }, _sum: { points: true } }),
  ]);
  return { points: balance._sum.points || 0, earned: earned._sum.points || 0 };
}

function progress(earned: number) {
  const next = levels.findIndex(level => level.threshold > earned);
  const index = next < 0 ? levels.length - 1 : next - 1;
  return { ...levels[index], level: index + 1, next: levels[index + 1] ?? null };
}

export function defaultQuanEvent(now: Date, excluded = new Set<string>()) {
  const day = quanDayKey(now);
  for (let offset = 0; offset <= 31; offset++) {
    const date = new Date(day + "T12:00:00+07:00");
    date.setUTCDate(date.getUTCDate() + offset);
    const solar = quanDayKey(date);
    if (excluded.has("lunar-" + solar)) continue;
    const [y, m, d] = solar.split("-").map(Number);
    const lunar = solarToLunar(d, m, y, 7);
    if (lunar.day !== 1 && lunar.day !== 15) continue;
    const startsAt = new Date(solar + "T20:00:00+07:00");
    const endsAt = new Date(startsAt.getTime() + 15 * 60_000);
    if (endsAt <= now) continue;
    return { id: "lunar-" + solar, title: "Cùng thắp đèn cầu an", startsAt, endsAt, cancelled: false };
  }
  return null;
}

async function currentEvent(tx: Tx, now: Date) {
  const [override, replaced] = await Promise.all([
    tx.quanEvent.findFirst({ where: { endsAt: { gt: now }, cancelled: false }, orderBy: { startsAt: "asc" } }),
    tx.quanEvent.findMany({ where: { id: { startsWith: "lunar-", gte: "lunar-" + quanDayKey(now) } }, select: { id: true } }),
  ]);
  const standard = defaultQuanEvent(now, new Set(replaced.map((item) => item.id)));
  if (override && (!standard || override.startsAt <= standard.startsAt || override.startsAt <= now)) return override;
  return standard;
}

function itemDetails(id: string) {
  if (id === "journey-lantern-seven") return { id, title: "Đèn sen bảy ngày", slot: "lantern", value: "#f4b2c3", price: 0, description: "Kỷ niệm bảy ngày thực hành ở Tu viện." };
  return QUAN_COSMETICS.find((item) => item.id === id) ||
    (id.startsWith("event-lantern-") ? { id, title: "Đèn kỷ niệm cầu an", slot: "lantern", value: "event-gold", price: 0, description: "Kỷ niệm một buổi cùng thắp đèn." } : null);
}

async function snapshot(tx: Tx, profile: QuanProfile, now: Date) {
  const dayKey = quanDayKey(now);
  const [balance, entries, items, settings, wishes, own, shares, event, charts, identities, ranking] = await Promise.all([
    totals(tx, profile.id),
    tx.quanEntry.findMany({ where: { profileId: profile.id }, orderBy: { createdAt: "desc" }, take: 100 }),
    tx.quanItem.findMany({ where: { profileId: profile.id }, orderBy: { acquiredAt: "asc" } }),
    tx.quanEcosystemSettings.findUnique({ where: { id: "global" } }),
    tx.quanWish.findMany({ where: { status: "public", expiresAt: { gt: now } }, orderBy: { createdAt: "desc" }, take: 60, include: { reactions: { where: { profileId: profile.id }, select: { kind: true } }, _count: { select: { reactions: true } } } }),
    tx.quanWish.findMany({ where: { profileId: profile.id, NOT: { status: "deleted" } }, orderBy: { createdAt: "desc" }, take: 50, include: { reactions: { where: { profileId: profile.id }, select: { kind: true } }, _count: { select: { reactions: true } } } }),
    tx.quanShare.findMany({ where: { profileId: profile.id, expiresAt: { gt: now } }, orderBy: { createdAt: "desc" }, take: 30 }),
    currentEvent(tx, now),
    profile.userId ? tx.chart.findMany({ where: { userId: profile.userId }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, title: true, input: true } }) : [],
    tx.quanIdentity.findMany({ where: { profileId: profile.id }, select: { guestId: true } }),
    tx.quanEntry.findUnique({ where: { profileId_kind_dayKey: { profileId: profile.id, kind: "ranking_opt_in", dayKey: "profile" } }, select: { id: true } }),
  ]);
  const sessions = await tx.quanOrder.findMany({
    where: { ownerId: { in: identities.map((identity) => identity.guestId) }, paidAt: { not: null } },
    orderBy: { paidAt: "desc" }, take: 30,
    select: { id: true, minutes: true, status: true, paidAt: true },
  });
  const hearts = await tx.quanWishReaction.groupBy({ by: ["wishId"], where: { wishId: { in: [...new Set([...wishes, ...own].map((wish) => wish.id))] }, kind: "heart" }, _count: { _all: true } });
  const heartCounts = new Map(hearts.map((row) => [row.wishId, row._count._all]));
  const wishView = (wish: (typeof wishes)[number]) => ({
    id: wish.id, text: wish.text, placement: wish.placement, status: wish.status === "restricted" || (wish.status === "public" && wish.expiresAt && wish.expiresAt <= now) ? "private" : wish.status,
    alias: "Khách ẩn danh", hearts: heartCounts.get(wish.id) || 0,
    blessings: wish._count.reactions - (heartCounts.get(wish.id) || 0),
    myReactions: wish.reactions.map((r) => r.kind), createdAt: wish.createdAt.toISOString(),
  });
  const daily = entries.find((e) => e.kind === "daily" && e.dayKey === dayKey);
  const calligraphy = entries.find((e) => e.kind === "calligraphy" && e.dayKey === dayKey);
  const meditation = entries.find((e) => e.kind === "meditate_start" && e.dayKey === dayKey);
  const chant = entries.find((e) => e.kind === "chant_start" && e.dayKey === dayKey);
  const eventJoin = event ? await tx.quanEntry.findUnique({ where: { profileId_kind_dayKey: { profileId: profile.id, kind: "event_join", dayKey: event.id } } }) : null;
  const eventClaim = event ? await tx.quanEntry.findUnique({ where: { profileId_kind_dayKey: { profileId: profile.id, kind: "event_claim", dayKey: event.id } } }) : null;
  return {
    monastery: await readMonastery(tx, profile.id, now),
    profile: { id: profile.id, alias: profile.alias, linked: Boolean(profile.userId), ...balance, ...progress(balance.earned), birthInput: profile.birthInput, equipped: profile.equipped },
    daily: daily ? { ...asBag(daily.data), sourceId: daily.id } : null,
    calligraphy: calligraphy ? { ...asBag(calligraphy.data), sourceId: calligraphy.id } : null,
    rankingOptIn: Boolean(ranking),
    history: entries.filter((e) => [...pointActivities, "calligraphy", "tarot1", "tarot3", "iching", "greet"].includes(e.kind)).slice(0, 50).map((e) => ({ id: e.id, kind: e.kind, dayKey: e.dayKey, result: e.data, createdAt: e.createdAt.toISOString() })),
    inventory: items.map((item) => ({ ...itemDetails(item.itemId), id: item.itemId, acquiredAt: item.acquiredAt.toISOString() })),
    cosmetics: QUAN_COSMETICS, wishes: wishes.map(wishView), myWishes: own.map(wishView),
    charts: charts.map((chart) => ({ id: chart.id, label: chart.title, year: asBag(chart.input).year })),
    sessions: sessions.map((session) => ({ ...session, status: session.status.toLowerCase(), paidAt: session.paidAt?.toISOString() })),
    meditation: { startedAt: meditation?.createdAt.toISOString() || null, completed: entries.some((e) => e.kind === "meditate" && e.dayKey === dayKey) },
    checkedIn: entries.some((e) => e.kind === "check_in" && e.dayKey === dayKey),
    chant: { startedAt: chant?.createdAt.toISOString() || null, completed: entries.some((e) => e.kind === "chant" && e.dayKey === dayKey) },
    event: event ? { id: event.id, title: event.title, startsAt: event.startsAt.toISOString(), endsAt: event.endsAt.toISOString(), active: !event.cancelled && event.startsAt <= now && event.endsAt > now, joinedAt: eventJoin?.createdAt.toISOString() || null, claimed: Boolean(eventClaim) } : null,
    shares: shares.map((s) => ({ id: s.id, url: `/tu-vi-quan/chia-se/${s.id}`, expiresAt: s.expiresAt.toISOString(), revoked: Boolean(s.revokedAt) })),
    flags: { publicPosting: settings?.publicPosting ?? true, ...asBag(settings?.features) }, serverTime: now.toISOString(),
  };
}

export async function readEcosystem(db: PrismaClient, actor: Actor, now = new Date()) {
  return ecosystemTransaction(db, async (tx) => {
    const profile = await ensureProfile(tx, actor);
    await metric(tx, profile, "visit", now);
    return snapshot(tx, profile, now);
  });
}

async function mergeProfiles(tx: Tx, source: QuanProfile, target: QuanProfile) {
  const now = new Date();
  if (source.id === target.id) return target;
  const rows = await tx.quanEntry.findMany({ where: { profileId: source.id }, orderBy: { createdAt: "asc" } });
  const rewardKinds = ["meditate", "chant", "monastery_meditate", "monastery_chant"];
  const targetRewards = await tx.quanEntry.findMany({ where: { profileId: target.id, kind: { in: rewardKinds } } });
  const desiredRewards = new Map<string, { day: string; activity: string; source: number; target: number }>();
  for (const row of [...rows, ...targetRewards]) {
    if (!rewardKinds.includes(row.kind)) continue;
    const activity = row.kind.replace("monastery_", "");
    const key = row.dayKey + ":" + activity;
    const reward = desiredRewards.get(key) ?? { day: row.dayKey, activity, source: 0, target: 0 };
    reward[row.profileId === source.id ? "source" : "target"] += row.points;
    desiredRewards.set(key, reward);
  }
  for (const row of rows) {
    const existing = await tx.quanEntry.findUnique({ where: { profileId_kind_dayKey: { profileId: target.id, kind: row.kind, dayKey: row.dayKey } } });
    if (row.kind.startsWith("practice_")) {
      const before = asBag(existing?.data), after = asBag(row.data);
      const data = json({ ...after, ...before, seconds: Math.max(Number(before.seconds) || 0, Number(after.seconds) || 0), taps: Math.max(Number(before.taps) || 0, Number(after.taps) || 0), running: false, lastAt: 0 });
      if (existing) {
        await tx.quanEntry.update({ where: { id: existing.id }, data: { data } });
        await tx.quanEntry.delete({ where: { id: row.id } });
      } else await tx.quanEntry.update({ where: { id: row.id }, data: { profileId: target.id, data } });
      continue;
    }
    if (existing) {
      if (row.createdAt < existing.createdAt) await tx.quanEntry.update({ where: { id: existing.id }, data: { data: row.data as Prisma.InputJsonValue, version: row.version, createdAt: row.createdAt } });
      // Keep both actual purchases in the ledger; identical owned cosmetics still cost what each guest spent.
      if (row.points < 0) await tx.quanEntry.update({ where: { id: row.id }, data: { profileId: target.id, kind: row.kind + ":merged:" + row.id } });
      else await tx.quanEntry.delete({ where: { id: row.id } });
    } else await tx.quanEntry.update({ where: { id: row.id }, data: { profileId: target.id } });
  }
  const mergedRewards = await tx.quanEntry.findMany({ where: { profileId: target.id, kind: { in: rewardKinds } } });
  for (const reward of desiredRewards.values()) {
    const legacy = mergedRewards.find(row => row.kind === reward.activity && row.dayKey === reward.day)?.points ?? 0;
    const monastery = mergedRewards.find(row => row.kind === "monastery_" + reward.activity && row.dayKey === reward.day);
    const desired = Math.max(reward.source, reward.target) - legacy;
    if (monastery && monastery.points !== desired) await tx.quanEntry.update({ where: { id: monastery.id }, data: { points: Math.max(0, desired) } });
  }
  for (const item of await tx.quanItem.findMany({ where: { profileId: source.id } })) {
    await tx.quanItem.upsert({ where: { profileId_itemId: { profileId: target.id, itemId: item.itemId } }, create: { profileId: target.id, itemId: item.itemId, acquiredAt: item.acquiredAt }, update: {} });
  }
  const balance = await totals(tx, target.id);
  if (balance.points < 0) fail(`Cần tích lũy thêm ${-balance.points} Điểm An Nhiên trước khi gộp hai sổ. Vật phẩm và dữ liệu hiện tại đã được giữ lại.`, 409);
  for (const reaction of await tx.quanWishReaction.findMany({ where: { profileId: source.id } })) {
    await tx.quanWishReaction.upsert({ where: { wishId_profileId_kind: { wishId: reaction.wishId, profileId: target.id, kind: reaction.kind } }, create: { wishId: reaction.wishId, profileId: target.id, kind: reaction.kind }, update: {} });
  }
  for (const report of await tx.quanWishReport.findMany({ where: { profileId: source.id } })) {
    const duplicate = await tx.quanWishReport.findUnique({ where: { wishId_profileId: { wishId: report.wishId, profileId: target.id } } });
    if (!duplicate) await tx.quanWishReport.update({ where: { wishId_profileId: { wishId: report.wishId, profileId: source.id } }, data: { profileId: target.id } });
  }
  for (const row of await tx.quanMetric.findMany({ where: { profileId: source.id } })) {
    await tx.quanMetric.upsert({ where: { profileId_name_dayKey: { profileId: target.id, name: row.name, dayKey: row.dayKey } }, create: { profileId: target.id, name: row.name, dayKey: row.dayKey, source: row.source, linked: row.linked, createdAt: row.createdAt }, update: {} });
  }
  await tx.quanIdentity.updateMany({ where: { profileId: source.id }, data: { profileId: target.id } });
  await tx.quanWish.updateMany({ where: { profileId: source.id }, data: { profileId: target.id } });
  await tx.quanShare.updateMany({ where: { profileId: source.id }, data: { profileId: target.id } });
  const encounters = await tx.quanEncounter.findMany({ where: { profileId: source.id } });
  for (const encounter of encounters) {
    if (encounter.freeDay) {
      const existing = await tx.quanEncounter.findUnique({ where: { profileId_freeDay: { profileId: target.id, freeDay: encounter.freeDay } } });
      if (existing) {
        const remainingMs = Math.min(quanRemainingMs(encounter, 300_000, now), quanRemainingMs(existing, 300_000, now));
        await tx.quanEncounter.update({ where: { id: existing.id }, data: { remainingMs, endsAt: null, outageSince: null, speakingUntil: null, state: remainingMs ? "left" : "ended" } });
        await tx.quanEncounter.update({ where: { id: encounter.id }, data: { profileId: target.id, freeDay: null, remainingMs: 0, endsAt: null, outageSince: null, speakingUntil: null, state: "ended" } });
        continue;
      }
    }
    await tx.quanEncounter.update({ where: { id: encounter.id }, data: { profileId: target.id } });
  }
  const merged = await tx.quanProfile.update({ where: { id: target.id }, data: {
    birthInput: target.birthInput ? undefined : source.birthInput ?? Prisma.DbNull,
    createdAt: source.createdAt < target.createdAt ? source.createdAt : target.createdAt,
    equipped: json({ ...asBag(source.equipped), ...asBag(target.equipped) }), recoveryDigest: null, blocked: source.blocked || target.blocked,
  } });
  await tx.quanProfile.delete({ where: { id: source.id } });
  return merged;
}

async function visibleWish(tx: Tx, id: string, now: Date) {
  return await tx.quanWish.findFirst({ where: { id, status: "public", expiresAt: { gt: now } } }) || fail("Điều ước không còn hiển thị.", 404);
}

export async function revokeWishShares(tx: Tx, id: string, now: Date) {
  await tx.quanShare.updateMany({ where: { snapshot: { path: ["sourceWishId"], equals: id }, revokedAt: null }, data: { revokedAt: now } });
}

export async function mutateEcosystem(db: PrismaClient, actor: Actor, body: Bag, now = new Date()) {
  if (["practice_start", "practice_tick", "practice_finish"].includes(String(body.action))) await requireQuanMonasterySeat(actor.guest.id);
  return ecosystemTransaction(db, async (tx) => {
    let profile = await ensureProfile(tx, actor);
    const action = str(body.action, 40);
    const day = quanDayKey(now);
    const extra: Bag & { incensePoints?: number } = {};
    const settings = await tx.quanEcosystemSettings.findUnique({ where: { id: "global" } });
    if (asBag(settings?.features)[action] === false) fail("Hoạt động này đang tạm nghỉ.", 503);
    const ranking = ["daily", "ritual", "check_in", "practice_finish"].includes(action) && await tx.quanEntry.findUnique({ where: { profileId_kind_dayKey: { profileId: profile.id, kind: "ranking_opt_in", dayKey: "profile" } }, select: { id: true } });
    const beforeTitle = ranking ? progress((await totals(tx, profile.id)).earned).title : null;
    if (action === "daily") {
      if (!["career", "love", "money"].includes(String(body.topic))) fail("Chọn một chủ đề.");
      const input = profile.birthInput as unknown as ChartInput | null;
      const chart = input ? generateTuViChart(input) : null;
      const result = drawDaily(body.topic as "career" | "love" | "money", chart, profile.id, day);
      if (chart) {
        const [year, month, date] = day.split("-").map(Number);
        const fortune = analyzeDate(new Date(year, month - 1, date, 12), chart.lunar.year);
        result.evidence.unshift(`Ngày ${fortune.canChi.day}. Tuổi ${chart.canChi.year}, bản mệnh ${chart.banMenh}.`);
      }
      const saved = await entry(tx, profile.id, "daily", day, result, 10, now, QUAN_DAILY_VERSION);
      extra.latestResult = { ...asBag(saved.data), sourceId: saved.id };
      await metric(tx, profile, "daily", now);
    } else if (action.startsWith("practice_") || action === "redeem_voice") {
      await mutateMonastery(tx, profile, body, now);
      if (action === "practice_finish") await metric(tx, profile, "ritual", now);
    } else if (action === "check_in") {
      await entry(tx, profile.id, "check_in", day, { title: "Điểm danh hôm nay" }, 5, now);
    } else if (action === "ritual") {
      const kind = str(body.kind, 30);
      if (!["incense", "greet", "meditate_start", "meditate_finish", "chant_start", "chant_finish"].includes(kind)) fail("Nghi thức không hợp lệ.");
      const note = body.note === undefined ? "" : str(body.note, 120).trim();
      if (kind === "incense" && body.count !== undefined && body.count !== 1 && body.count !== 3) fail("Chọn một hoặc ba nén hương.");
      if (kind === "incense") {
        const alreadyLit = await tx.quanEntry.findUnique({ where: { profileId_kind_dayKey: { profileId: profile.id, kind, dayKey: day } }, select: { id: true } });
        extra.incensePoints = alreadyLit ? 0 : 5;
      }
      if (kind === "meditate_finish" || kind === "chant_finish") {
        const meditation = kind === "meditate_finish";
        const activity = meditation ? "meditate" : "chant";
        const started = await tx.quanEntry.findUnique({ where: { profileId_kind_dayKey: { profileId: profile.id, kind: activity + "_start", dayKey: day } } });
        if (!started || now.getTime() - started.createdAt.getTime() < (meditation ? 60_000 : 30_000)) fail(meditation ? "Hãy dành đủ một phút tĩnh tâm." : "Hãy dành đủ 30 giây tụng niệm.", 409);
        const monastery = await tx.quanEntry.findUnique({ where: { profileId_kind_dayKey: { profileId: profile.id, kind: "monastery_" + activity, dayKey: day } } });
        await entry(tx, profile.id, activity, day, { title: meditation ? "Một phút tĩnh tâm" : "Tụng niệm", body: note }, Math.max(0, 5 - (monastery?.points ?? 0)), now);
      } else await entry(tx, profile.id, kind, day, { title: kind === "incense" ? "Xin lộc đầu ngày" : kind === "greet" ? "Chắp tay" : kind === "chant_start" ? "Bắt đầu tụng niệm" : "Bắt đầu tĩnh tâm", body: note, count: body.count || 1 }, kind === "incense" ? 5 : 0, now);
      if (!kind.endsWith("_start")) await metric(tx, profile, "ritual", now);
    } else if (action === "calligraphy") {
      if (body.mood !== "calm" && body.mood !== "playful") fail("Chọn phong cách xin chữ.");
      const set = CALLIGRAPHY[body.mood as keyof typeof CALLIGRAPHY];
      const [word, message] = set[randomInt(set.length)];
      const saved = await entry(tx, profile.id, "calligraphy", day, { title: word, body: message, action: "Chữ hôm nay của bạn tại Tử Vi Quán." }, 0, now);
      extra.latestResult = { ...asBag(saved.data), sourceId: saved.id };
    } else if (action === "ranking") {
      if (typeof body.enabled !== "boolean") fail("Chọn có tham gia bảng vàng hay không.");
      if (body.enabled === true) {
        if (profile.blocked || !moderateWish(profile.alias).ok) fail("Hãy chọn bí danh phù hợp trước khi hiện lên bảng.");
        await entry(tx, profile.id, "ranking_opt_in", "profile", {}, 0, now);
      } else await tx.quanEntry.deleteMany({ where: { profileId: profile.id, kind: "ranking_opt_in", dayKey: "profile" } });
    } else if (action === "tarot" || action === "iching") {
      if (action === "tarot" && body.count !== 1 && body.count !== 3) fail("Chọn một hoặc ba lá.");
      const kind = action === "tarot" ? "tarot" + body.count : "iching";
      const result = action === "tarot" ? drawTarot(body.count as 1 | 3, randomInt) : drawIChing(randomInt);
      const saved = await entry(tx, profile.id, kind, day, result, 0, now);
      extra.latestResult = { ...asBag(saved.data), sourceId: saved.id };
      await metric(tx, profile, "divination", now);
    } else if (action === "birth") {
      let input = body.input;
      if (body.chartId !== undefined) {
        if (!actor.userId) fail("Đăng nhập để chọn lá số đã lưu.", 401);
        const chart = await tx.chart.findFirst({ where: { id: str(body.chartId, 64), userId: actor.userId }, select: { input: true } });
        if (!chart) fail("Không tìm thấy lá số của bạn.", 404);
        input = chart.input;
      }
      const chart = input === null ? null : readQuanChart(input);
      profile = await saveQuanBirth(tx, profile, chart, now);
      if (chart) extra.chartSummary = quanChartSummary(chart);
    } else if (action === "alias") {
      const alias = normalizeQuanAlias(body.alias) || fail("Bí danh không hợp lệ.");
      profile = await tx.quanProfile.update({ where: { id: profile.id }, data: { alias } });
      if (!moderateWish(alias).ok) await tx.quanEntry.deleteMany({ where: { profileId: profile.id, kind: "ranking_opt_in" } });
    } else if (action === "link") {
      if (!actor.userId) fail("Đăng nhập để liên kết tiến trình.", 401);
      if (profile.userId && profile.userId !== actor.userId) fail("Hồ sơ đã liên kết tài khoản khác.", 403);
      const accountProfile = await tx.quanProfile.findUnique({ where: { userId: actor.userId } });
      profile = accountProfile ? await mergeProfiles(tx, profile, accountProfile) : await tx.quanProfile.update({ where: { id: profile.id }, data: { userId: actor.userId } });
      await metric(tx, profile, "profile_saved", now);
    } else if (action === "recovery_issue") {
      const code = randomBytes(24).toString("base64url");
      profile = await tx.quanProfile.update({ where: { id: profile.id }, data: { recoveryDigest: digest(code) } });
      extra.recoveryCode = code;
    } else if (action === "recovery_restore") {
      const code = str(body.code, 32);
      if (!/^[A-Za-z0-9_-]{32}$/.test(code)) fail("Mã khôi phục không hợp lệ.");
      const restored = await tx.quanProfile.findUnique({ where: { recoveryDigest: digest(code) } });
      if (!restored) fail("Không tìm thấy mã khôi phục.", 404);
      if (restored.userId && restored.userId !== actor.userId) fail("Hãy đăng nhập tài khoản đã liên kết để khôi phục.", 403);
      if (profile.userId && profile.userId !== restored.userId) fail("Không thể trộn tiến trình từ hai tài khoản.", 409);
      profile = await mergeProfiles(tx, profile, restored);
      profile = await tx.quanProfile.update({ where: { id: profile.id }, data: { recoveryDigest: null } });
      extra.restored = true;
    } else if (action === "wish" || action === "wish_edit") {
      const text = str(body.text, 120).normalize("NFC").trim();
      if (!text || /[\u0000-\u0008\u000b-\u001f\u007f]/u.test(text)) fail("Viết lời ước từ một đến 120 ký tự.");
      const prior = action === "wish_edit" ? await tx.quanWish.findFirst({ where: { id: str(body.id, 64), profileId: profile.id, NOT: { status: "deleted" } } }) : null;
      if (action === "wish_edit" && !prior) fail("Không tìm thấy điều ước.", 404);
      const placement = body.placement ?? prior?.placement ?? "tree";
      if (placement !== "tree" && placement !== "lotus") fail("Chọn cây hoặc hoa đăng.");
      const verdict = moderateWish(text);
      const requestedPublic = body.public === true;
      const restricted = prior?.status === "hidden" || prior?.status === "restricted";
      if (requestedPublic && (profile.blocked || restricted)) fail("Điều ước này chỉ có thể lưu riêng.", 403);
      const publishing = requestedPublic && settings?.publicPosting !== false;
      const status = restricted ? prior.status : publishing ? verdict.ok ? "public" : "pending" : "private";
      const same = !prior ? await tx.quanWish.findFirst({ where: { profileId: profile.id, text, placement, status, createdAt: { gte: new Date(now.getTime() - 30_000) } } }) : null;
      const id = prior?.id || same?.id || randomBytes(16).toString("hex");
      if (publishing) {
        const publicEntry = await entry(tx, profile.id, "wish_public", day, { id }, 0, now);
        if (asBag(publicEntry.data).id !== id) fail("Mỗi ngày bạn chia sẻ một điều ước công khai.", 409);
      }
      const expiresAt = publishing ? (prior?.expiresAt && prior.expiresAt > now ? prior.expiresAt : new Date(now.getTime() + TTL)) : null;
      await tx.quanWish.upsert({ where: { id }, create: { id, profileId: profile.id, text, placement, status, expiresAt, createdAt: now }, update: { text, placement, status, expiresAt } });
      if (prior && (prior.text !== text || status !== prior.status)) await revokeWishShares(tx, id, now);
      await metric(tx, profile, "wish", now);
    } else if (action === "wish_delete") {
      const id = str(body.id, 64);
      const result = await tx.quanWish.updateMany({ where: { id, profileId: profile.id }, data: { status: "deleted", text: "", expiresAt: null } });
      if (!result.count) fail("Không tìm thấy điều ước.", 404);
      await revokeWishShares(tx, id, now);
    } else if (action === "wish_react") {
      const id = str(body.id, 64), kind = str(body.kind, 20);
      if (!["heart", "peace", "strength", "joy", "hope", "care"].includes(kind)) fail("Chọn lời chúc có sẵn.");
      await visibleWish(tx, id, now);
      await tx.quanWishReaction.upsert({ where: { wishId_profileId_kind: { wishId: id, profileId: profile.id, kind } }, create: { wishId: id, profileId: profile.id, kind }, update: {} });
      await metric(tx, profile, "reaction", now);
    } else if (action === "wish_report") {
      const id = str(body.id, 64);
      await visibleWish(tx, id, now);
      await tx.quanWishReport.upsert({ where: { wishId_profileId: { wishId: id, profileId: profile.id } }, create: { wishId: id, profileId: profile.id, userId: profile.userId }, update: {} });
      const reports = await tx.quanWishReport.count({ where: { wishId: id, userId: { not: null } } });
      if (reports >= 3) {
        await tx.quanWish.update({ where: { id }, data: { status: "hidden" } });
        await revokeWishShares(tx, id, now);
      }
    } else if (action === "buy" || action === "equip") {
      const itemId = str(body.itemId, 80);
      const item = itemDetails(itemId) || fail("Không tìm thấy vật phẩm.", 404);
      let owned = await tx.quanItem.findUnique({ where: { profileId_itemId: { profileId: profile.id, itemId } } });
      if (action === "buy" && !owned) {
        if (!QUAN_COSMETICS.some((item) => item.id === itemId)) fail("Vật phẩm này chỉ nhận từ sự kiện.");
        const balance = await totals(tx, profile.id);
        if ("unlockAt" in item && typeof item.unlockAt === "number" && balance.earned < item.unlockAt) fail("Bạn chưa đạt cấp mở vật phẩm này.", 409);
        if (balance.points < item.price) fail("Bạn chưa đủ Điểm An Nhiên.", 409);
        await entry(tx, profile.id, "buy:" + itemId, "", {}, -item.price, now);
        owned = await tx.quanItem.create({ data: { profileId: profile.id, itemId, acquiredAt: now } });
      }
      if (action === "equip") {
        if (!owned) fail("Bạn chưa sở hữu vật phẩm này.", 403);
        profile = await tx.quanProfile.update({ where: { id: profile.id }, data: { equipped: json({ ...asBag(profile.equipped), [item.slot]: item.value }) } });
      }
    } else if (action === "event_join" || action === "event_claim") {
      const event = await currentEvent(tx, now);
      if (!event || event.cancelled || event.startsAt > now || event.endsAt <= now) fail("Buổi cầu an chưa diễn ra hoặc đã kết thúc.", 409);
      if (action === "event_join") await entry(tx, profile.id, "event_join", event.id, {}, 0, now);
      else {
        const joined = await tx.quanEntry.findUnique({ where: { profileId_kind_dayKey: { profileId: profile.id, kind: "event_join", dayKey: event.id } } });
        if (!joined || now.getTime() - joined.createdAt.getTime() < 60_000) fail("Hãy cùng thắp đèn đủ một phút.", 409);
        await entry(tx, profile.id, "event_claim", event.id, { title: event.title }, 0, now);
        await tx.quanItem.upsert({ where: { profileId_itemId: { profileId: profile.id, itemId: "event-lantern-" + event.id } }, create: { profileId: profile.id, itemId: "event-lantern-" + event.id, acquiredAt: now }, update: {} });
      }
    } else if (action === "horoscope") {
      if (!profile.birthInput) fail("Hãy lưu thông tin sinh trước.");
      const year = body.year;
      if (typeof year !== "number" || !Number.isInteger(year) || year < 1900 || year > 2100) fail("Chọn năm từ 1900 đến 2100.");
      extra.horoscope = buildQuanHoroscope(profile.birthInput as unknown as ChartInput, year);
      extra.chartSummary = quanChartSummary(generateTuViChart({ ...profile.birthInput as unknown as ChartInput, viewYear: year }));
    } else if (action === "share") {
      const sourceId = str(body.sourceId, 64);
      const source = await tx.quanEntry.findFirst({ where: { id: sourceId, profileId: profile.id, kind: { in: ["daily", "calligraphy", "tarot1", "tarot3", "iching"] } } });
      const wish = !source ? await tx.quanWish.findFirst({ where: { id: sourceId, profileId: profile.id, NOT: { status: "deleted" } } }) : null;
      const achievement = sourceId === "achievement";
      if (!source && !wish && !achievement) fail("Không tìm thấy nội dung để chia sẻ.", 404);
      if (wish && (profile.blocked || ["hidden", "restricted", "pending"].includes(wish.status) || !moderateWish(wish.text).ok)) fail("Điều ước này chỉ có thể lưu riêng.");
      const data = asBag(source?.data);
      const shareSnapshot = { kind: source?.kind || (wish ? "wish" : "achievement"), title: String(data.title || (wish ? "Lời nguyện cầu" : progress((await totals(tx, profile.id)).earned).title)).slice(0, 180), body: String(wish?.text || data.body || "Một hành trình an nhiên, từng ngày một.").slice(0, 1000), action: String(data.action || "Ghé Tử Vi Quán để dành một khoảng bình yên.").slice(0, 300), ...(body.showAlias === true ? { alias: profile.alias } : {}) };
      const share = await tx.quanShare.create({ data: { id: randomBytes(18).toString("base64url"), profileId: profile.id, snapshot: { ...shareSnapshot, ...(wish ? { sourceWishId: wish.id } : {}) }, expiresAt: new Date(now.getTime() + TTL), createdAt: now } });
      extra.share = { id: share.id, url: `/tu-vi-quan/chia-se/${share.id}`, snapshot: shareSnapshot, expiresAt: share.expiresAt.toISOString() };
      await metric(tx, profile, "share_created", now);
    } else if (action === "share_revoke") {
      await tx.quanShare.updateMany({ where: { id: str(body.id, 64), profileId: profile.id }, data: { revokedAt: now } });
    } else if (action === "telemetry") {
      const name = str(body.name, 32);
      if (!["share_image", "share_open", "checkout"].includes(name)) fail("Sự kiện không hợp lệ.");
      let source = "direct";
      if (name === "share_open") {
        const valid = await tx.quanShare.findFirst({ where: { id: str(body.shareId, 64), revokedAt: null, expiresAt: { gt: now } } });
        if (!valid) fail("Liên kết không còn hiệu lực.", 404);
        if (valid.profileId === profile.id) fail("Đây là liên kết của bạn.");
        source = "shared_link";
      }
      await metric(tx, profile, name, now, source);
    } else fail("Thao tác không hợp lệ.");
    const view = await snapshot(tx, profile, now);
    if (beforeTitle && beforeTitle !== view.profile.title) {
      await entry(tx, profile.id, "public_level", view.profile.title, { title: view.profile.title }, 0, now);
    }
    return { ...view, ...extra };
  });
}

function quanChartSummary(chart: TuViChart) {
  return { menh: chart.menh, banMenh: chart.banMenh, cuc: chart.cuc, canChi: chart.canChi.year,
    summary: chart.summary, palaces: chart.palaces.map(({ name, branch, mainStars }) => ({ name, branch, mainStars })) };
}

export async function resolveQuanOwners(db: PrismaClient, guestId: string, userId?: string) {
  if (!quanEcosystemEnabled()) return [guestId];
  // Check authorization and resolve sibling guest IDs in one statement so a concurrent link cannot widen access.
  const identities = await db.quanIdentity.findMany({
    where: { profile: { identities: { some: { guestId } }, ...(userId ? { OR: [{ userId: null }, { userId }] } : { userId: null }) } },
    select: { guestId: true },
  });
  return identities.length ? identities.map((i) => i.guestId) : [guestId];
}

export async function publicQuanShare(db: PrismaClient, id: string, now = new Date()) {
  if (!/^[A-Za-z0-9_-]{24}$/.test(id)) return null;
  const row = await db.quanShare.findFirst({ where: { id, revokedAt: null, expiresAt: { gt: now } }, select: { snapshot: true } });
  if (!row) return null;
  const { kind, title, body, action, alias } = asBag(row.snapshot);
  return { kind, title, body, action, ...(typeof alias === "string" ? { alias } : {}) };
}
