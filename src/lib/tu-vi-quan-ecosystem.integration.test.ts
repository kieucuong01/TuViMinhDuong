import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it, vi } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { defaultQuanEvent, mutateEcosystem, publicQuanShare, readEcosystem, resolveQuanOwners } from "./tu-vi-quan-ecosystem";
import { readQuanAdminEcosystem, updateQuanAdminEcosystem } from "./tu-vi-quan-admin";

vi.mock("server-only", () => ({}));
const url = process.env.QUAN_TEST_DATABASE_URL;
if (url && !/^postgresql:\/\/[^/]+@127\.0\.0\.1:\d+\/quan_test(?:_\d+)?$/.test(url)) throw new Error("Use a disposable localhost quan_test database");
const db = url ? new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }) : null;
const date = new Date("2026-11-04T14:30:00Z");
const later = (seconds: number, base = date) => new Date(base.getTime() + seconds * 1000);
const guests: string[] = [], users: string[] = [];
function actor(userId?: string) {
  const id = randomUUID();
  guests.push(id);
  return { guest: { id, alias: "Khách thử" }, userId };
}
async function user() {
  const record = await db!.user.create({ data: { email: `${randomUUID()}@test.invalid` } });
  users.push(record.id);
  return record.id;
}
afterAll(async () => {
  if (!db) return;
  await db.quanOrder.deleteMany({ where: { ownerId: { in: guests } } });
  await db.quanProfile.deleteMany({ where: { identities: { some: { guestId: { in: guests } } } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

describe.skipIf(!db)("Tử Vi Quán ecosystem in PostgreSQL", () => {
  it("counts foreground practice, caps shared rewards and pauses when switching activities", async () => {
    const guest = actor();
    const run = (action: string, mode: string, seconds: number, tap = false) => mutateEcosystem(db!, guest, { action, mode, tap }, later(seconds));
    await run("practice_start", "meditate", 0);
    const away = await run("practice_tick", "meditate", 600);
    expect(away.monastery.practices.meditate?.seconds).toBe(0);
    await expect(run("practice_finish", "meditate", 600)).rejects.toMatchObject({ status: 409 });
    for (let seconds = 605; seconds <= 660; seconds += 5) await run("practice_tick", "meditate", seconds);
    const short = await run("practice_finish", "meditate", 660);
    expect(short.profile.points).toBe(5);
    await run("practice_start", "meditate", 660);
    for (let seconds = 665; seconds <= 780; seconds += 5) await run("practice_tick", "meditate", seconds);
    expect((await run("practice_finish", "meditate", 780)).profile.points).toBe(10);
    await run("practice_start", "beads", 780);
    for (let seconds = 785; seconds <= 915; seconds += 5) await run("practice_tick", "beads", seconds, true);
    const beads = await run("practice_finish", "beads", 915);
    expect(beads.profile.points).toBe(20);
    expect(beads.monastery.practices.beads?.taps).toBe(27);
    await run("practice_start", "chant", 915);
    for (let seconds = 920; seconds <= 1035; seconds += 5) await run("practice_tick", "chant", seconds);
    expect((await run("practice_finish", "chant", 1035)).profile.points).toBe(20);
    await mutateEcosystem(db!, guest, { action: "ritual", kind: "chant_start" }, later(1035));
    expect((await mutateEcosystem(db!, guest, { action: "ritual", kind: "chant_finish" }, later(1065))).profile.points).toBe(20);
    await run("practice_start", "meditate", 1065);
    const switched = await run("practice_start", "garden", 1065);
    expect(switched.monastery.practices.meditate?.running).toBe(false);
    for (let seconds = 1070; seconds <= 1130; seconds += 5) await run("practice_tick", "garden", seconds, true);
    const garden = await run("practice_finish", "garden", 1130);
    expect(garden.profile).toMatchObject({ points: 25, earned: 25 });
    expect(garden.monastery.visits).toBe(1);
    await db!.quanEntry.createMany({ data: Array.from({ length: 6 }, (_, index) => ({ profileId: garden.profile.id, kind: "monastery_visit", dayKey: `fixture-${index}`, data: {}, points: 0, version: "test" })) });
    const bloomed = await run("practice_finish", "garden", 1130);
    expect(bloomed.monastery.lotusBloomed).toBe(true);
    expect(bloomed.inventory).toContainEqual(expect.objectContaining({ id: "journey-lantern-seven" }));
    const newDay = await readEcosystem(db!, guest, new Date("2026-11-04T17:00:00Z"));
    expect(newDay.monastery.practices.beads).toBeNull();
    expect(newDay.monastery.rewards).toEqual({ meditate: 0, chant: 0, garden: 0 });
  }, 30_000);

  it("redeems once per day atomically, keeps at most two unused tickets and never spends lifetime points", async () => {
    const guest = actor();
    const initial = await readEcosystem(db!, guest, date);
    await expect(mutateEcosystem(db!, guest, { action: "redeem_voice" }, date)).rejects.toMatchObject({ status: 409 });
    await db!.quanEntry.create({ data: { profileId: initial.profile.id, kind: "daily", dayKey: "fixture", data: {}, points: 180, version: "test" } });
    const orders = await Promise.all([1, 2].map(() => mutateEcosystem(db!, guest, { action: "redeem_voice" }, date)));
    expect(orders.map(view => view.profile.points)).toEqual([120, 120]);
    expect(orders[1].monastery.tickets).toHaveLength(1);
    expect(orders[1].profile.earned).toBe(180);
    await mutateEcosystem(db!, guest, { action: "redeem_voice" }, later(86400));
    await expect(mutateEcosystem(db!, guest, { action: "redeem_voice" }, later(2 * 86400))).rejects.toMatchObject({ status: 409 });
    expect((await readEcosystem(db!, actor(), date)).monastery.tickets).toHaveLength(0);
  });

  it("merges the highest earned practice milestone without doubling old ritual rewards", async () => {
    const userId = await user(), a = actor(userId), b = actor(userId);
    const target = await mutateEcosystem(db!, a, { action: "link" }, date);
    const source = await readEcosystem(db!, b, date);
    await db!.quanEntry.createMany({ data: [
      { profileId: target.profile.id, kind: "meditate", dayKey: "2026-11-04", points: 5 },
      { profileId: target.profile.id, kind: "monastery_meditate", dayKey: "2026-11-04", points: 0 },
      { profileId: source.profile.id, kind: "monastery_meditate", dayKey: "2026-11-04", points: 10 },
    ].map(row => ({ ...row, data: {}, version: "test" })) });
    const merged = await mutateEcosystem(db!, b, { action: "link" }, date);
    expect(merged.profile).toMatchObject({ points: 10, earned: 10 });
    expect(merged.monastery.rewards.meditate).toBe(10);
  });
  it("keeps one shareable calligraphy card per day and requires consent for ranking", async () => {
    const guest = actor();
    const first = await mutateEcosystem(db!, guest, { action: "calligraphy", mood: "playful" }, date);
    const again = await mutateEcosystem(db!, guest, { action: "calligraphy", mood: "calm" }, later(1));
    expect(again.calligraphy).toEqual(first.calligraphy);
    expect(first.calligraphy?.title).toEqual(expect.any(String));
    expect(first.profile.points).toBe(0);
    expect(first.rankingOptIn).toBe(false);
    const accepted = await mutateEcosystem(db!, guest, { action: "ranking", enabled: true }, date);
    expect(accepted.rankingOptIn).toBe(true);
    const declined = await mutateEcosystem(db!, guest, { action: "ranking", enabled: false }, date);
    expect(declined.rankingOptIn).toBe(false);
  });

  it("persists daily draws and caps points under concurrency and Vietnam midnight", async () => {
    const guest = actor();
    await readEcosystem(db!, guest, date);
    const draws = await Promise.all(["career", "money"].map((topic) => mutateEcosystem(db!, guest, { action: "daily", topic }, date)));
    expect(draws[0].daily).toEqual(draws[1].daily);
    expect(draws[1].profile.points).toBe(10);
    const incense = await Promise.all([1, 3].map(count => mutateEcosystem(db!, guest, { action: "ritual", kind: "incense", count }, date)));
    expect(incense.map(result => result.profile.points)).toEqual([15, 15]);
    expect(incense.map(result => result.incensePoints).sort()).toEqual([0, 5]);
    await mutateEcosystem(db!, guest, { action: "ritual", kind: "meditate_start" }, date);
    await expect(mutateEcosystem(db!, guest, { action: "ritual", kind: "meditate_finish" }, later(59))).rejects.toMatchObject({ status: 409 });
    const finishes = await Promise.all(Array.from({ length: 2 }, () => mutateEcosystem(db!, guest, { action: "ritual", kind: "meditate_finish" }, later(60))));
    expect(finishes.map((result) => result.profile.points)).toEqual([20, 20]);
    const next = await mutateEcosystem(db!, guest, { action: "daily", topic: "love" }, new Date("2026-11-04T17:00:00Z"));
    expect(next.profile.points).toBe(30);
    expect(next.history[0].dayKey).toBe("2026-11-05");
  });

  it("merges accounts, requires account auth on other devices, and consumes recovery once", async () => {
    const userId = await user(), a = actor(userId), b = actor(userId), stranger = actor();
    await mutateEcosystem(db!, a, { action: "daily", topic: "career" }, date);
    await mutateEcosystem(db!, a, { action: "link" }, date);
    const oldOrder = await db!.quanOrder.create({ data: {
      ownerId: a.guest.id, alias: a.guest.alias, recoveryDigest: randomUUID(), orderCode: BigInt("1100000000123"),
      amountVnd: 200_000, minutes: 30, status: "ENDED", chart: {}, paidAt: date, expiresAt: later(900),
    } });
    await mutateEcosystem(db!, b, { action: "daily", topic: "money" }, later(1));
    const merged = await mutateEcosystem(db!, b, { action: "link" }, later(2));
    expect(merged.profile).toMatchObject({ points: 10, linked: true });
    expect(merged.daily?.topic).toBe("career");
    expect(merged.sessions).toContainEqual(expect.objectContaining({ id: oldOrder.id, minutes: 30, status: "ended" }));
    expect((await readEcosystem(db!, stranger, date)).sessions).toEqual([]);
    expect(await resolveQuanOwners(db!, b.guest.id, userId)).toEqual(expect.arrayContaining([a.guest.id, b.guest.id]));
    expect(await resolveQuanOwners(db!, b.guest.id)).toEqual([b.guest.id]);
    await expect(readEcosystem(db!, { guest: a.guest }, date)).rejects.toMatchObject({ status: 401 });
    const issued = await mutateEcosystem(db!, b, { action: "recovery_issue" }, later(3));
    await expect(mutateEcosystem(db!, stranger, { action: "recovery_restore", code: issued.recoveryCode }, later(4))).rejects.toMatchObject({ status: 403 });
    const recovered = await mutateEcosystem(db!, actor(userId), { action: "recovery_restore", code: issued.recoveryCode }, later(5));
    expect(recovered.profile.id).toBe(merged.profile.id);
    await expect(mutateEcosystem(db!, actor(userId), { action: "recovery_restore", code: issued.recoveryCode }, later(6))).rejects.toMatchObject({ status: 404 });
  });

  it("awards check-in and chanting once per day and gates cosmetics by lifetime points", async () => {
    const guest = actor();
    const send = (body: Record<string, unknown>, at = date) => mutateEcosystem(db!, guest, body, at);
    const reward = { action: "buy", itemId: "altar-lacquer" };
    await expect(send(reward)).rejects.toMatchObject({ status: 409 });
    const checks = await Promise.all([send({ action: "check_in" }), send({ action: "check_in" })]);
    expect(checks.map(view => view.profile.earned)).toEqual([5, 5]);
    expect(checks[1].checkedIn).toBe(true);
    await send({ action: "ritual", kind: "chant_start" });
    await expect(send({ action: "ritual", kind: "chant_finish" }, later(29))).rejects.toMatchObject({ status: 409 });
    const finishes = await Promise.all([send({ action: "ritual", kind: "chant_finish" }, later(30)), send({ action: "ritual", kind: "chant_finish" }, later(31))]);
    expect(finishes.map(view => view.profile.earned)).toEqual([10, 10]);
    const midnight = new Date("2026-11-04T17:00:00Z");
    const next = await send({ action: "check_in" }, midnight);
    expect(next).toMatchObject({ checkedIn: true, chant: { completed: false, startedAt: null }, profile: { points: 15, level: 1 } });
    for (let offset = 1; offset <= 17; offset++) await send({ action: "check_in" }, later(offset * 86400, midnight));
    const claimed = await send(reward, later(17 * 86400, midnight));
    expect(claimed.profile).toMatchObject({ points: 100, earned: 100, level: 2 });
    expect(claimed.inventory).toContainEqual(expect.objectContaining({ id: "altar-lacquer" }));
    await send({ action: "buy", itemId: "robe-jade" }, later(17 * 86400, midnight));
    const equipped = await send({ action: "equip", itemId: "altar-lacquer" }, later(17 * 86400, midnight));
    expect(equipped.profile).toMatchObject({ points: 40, earned: 100, level: 2, equipped: { altar: "#a33d31" } });
  });

  it("keeps private wishes private, applies report thresholds and revokes share snapshots", async () => {
    const a = actor(), b = actor();
    const written = await mutateEcosystem(db!, a, { action: "wish", text: "Mong nhà mình bình an", placement: "lotus" }, date);
    const id = written.myWishes[0].id;
    expect((await readEcosystem(db!, b, date)).wishes).not.toContainEqual(expect.objectContaining({ id }));
    await expect(mutateEcosystem(db!, b, { action: "share", sourceId: id }, date)).rejects.toMatchObject({ status: 404 });
    const shareResult = await mutateEcosystem(db!, a, { action: "share", sourceId: id }, date);
    const share = shareResult.share as { id: string };
    expect(await publicQuanShare(db!, share.id, date)).toMatchObject({ body: "Mong nhà mình bình an" });
    expect(await publicQuanShare(db!, share.id, date)).not.toHaveProperty("alias");
    await mutateEcosystem(db!, a, { action: "share_revoke", id: share.id }, date);
    expect(await publicQuanShare(db!, share.id, date)).toBeNull();
    const edited = await mutateEcosystem(db!, a, { action: "wish_edit", id, text: "Gọi 0901234567", public: true }, date);
    expect(edited.myWishes.find((w) => w.id === id)?.status).toBe("pending");
    await mutateEcosystem(db!, a, { action: "wish_edit", id, text: "Mong nhà mình bình an", public: true }, date);
    await mutateEcosystem(db!, b, { action: "wish_report", id }, date);
    for (let i = 0; i < 3; i++) {
      const viewer = actor(await user());
      await mutateEcosystem(db!, viewer, { action: "link" }, date);
      await mutateEcosystem(db!, viewer, { action: "wish_report", id }, date);
    }
    expect((await readEcosystem(db!, a, date)).myWishes.find((w) => w.id === id)?.status).toBe("hidden");
    expect((await readEcosystem(db!, b, date)).wishes.some((w) => w.id === id)).toBe(false);
    expect((await readQuanAdminEcosystem(db!, date)).wishes).toContainEqual(expect.objectContaining({ id, status: "hidden" }));
    await updateQuanAdminEcosystem(db!, await user(), { ecosystemAction: "keep_private", id });
    expect((await readEcosystem(db!, a, date)).myWishes.find((w) => w.id === id)?.status).toBe("private");
    await expect(mutateEcosystem(db!, a, { action: "wish_edit", id, text: "Mong nhà bình an", public: true }, date)).rejects.toMatchObject({ status: 403 });
    await expect(mutateEcosystem(db!, a, { action: "share", sourceId: id }, date)).rejects.toMatchObject({ status: 400 });
    const another = await mutateEcosystem(db!, a, { action: "wish", text: "Một ngày nhẹ nhàng" }, date);
    const privateId = another.myWishes.find((wish) => wish.text === "Một ngày nhẹ nhàng")!.id;
    const anotherShare = (await mutateEcosystem(db!, a, { action: "share", sourceId: privateId }, date)).share as { id: string };
    await updateQuanAdminEcosystem(db!, await user(), { ecosystemAction: "block", id });
    expect(await publicQuanShare(db!, anotherShare.id, date)).toBeNull();
    await expect(mutateEcosystem(db!, a, { action: "share", sourceId: privateId }, date)).rejects.toMatchObject({ status: 400 });
  });

  it("serializes cosmetic spend and grants one event keepsake after sixty seconds", async () => {
    const a = actor();
    const { profile, cosmetics } = await readEcosystem(db!, a, date);
    const items = cosmetics.filter((item) => item.price === 60);
    expect(items.length).toBeGreaterThan(1);
    await db!.quanEntry.create({ data: { profileId: profile.id, kind: "daily", dayKey: "2026-11-03", points: 60, data: {}, version: "test" } });
    const results = await Promise.allSettled(items.slice(0, 2).map((item) => mutateEcosystem(db!, a, { action: "buy", itemId: item.id }, date)));
    expect(results.filter((item) => item.status === "fulfilled")).toHaveLength(1);
    const event = defaultQuanEvent(date)!;
    await mutateEcosystem(db!, a, { action: "event_join" }, event.startsAt);
    await expect(mutateEcosystem(db!, a, { action: "event_claim" }, later(59, event.startsAt))).rejects.toMatchObject({ status: 409 });
    const claim = await Promise.all(Array.from({ length: 2 }, () => mutateEcosystem(db!, a, { action: "event_claim" }, later(60, event.startsAt))));
    expect(claim[1].profile.points).toBe(0);
    expect(claim[1].inventory.filter((item) => item.id.startsWith("event-lantern-")).length).toBe(1);
  });

  it("rolls back an overdrawn merge and preserves both inventories", async () => {
    const userId = await user(), a = actor(userId), b = actor(userId);
    const [first, second] = await Promise.all([readEcosystem(db!, a, date), readEcosystem(db!, b, date)]);
    const items = first.cosmetics.filter((item) => item.price === 60);
    for (const [index, profile] of [first.profile, second.profile].entries()) {
      for (let day = 1; day <= 6; day++) await db!.quanEntry.create({ data: { profileId: profile.id, kind: "daily", dayKey: `2026-10-0${day}`, points: 10, data: {}, version: "test" } });
      await mutateEcosystem(db!, index === 0 ? a : b, { action: "buy", itemId: items[index].id }, date);
    }
    await mutateEcosystem(db!, a, { action: "link" }, date);
    await expect(mutateEcosystem(db!, b, { action: "link" }, date)).rejects.toMatchObject({ status: 409 });
    expect((await readEcosystem(db!, a, date)).inventory.map((item) => item.id)).toEqual([items[0].id]);
    expect((await readEcosystem(db!, b, date)).inventory.map((item) => item.id)).toEqual([items[1].id]);
  });
});
