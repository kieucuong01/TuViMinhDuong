import "server-only";
import { randomUUID } from "node:crypto";
import type { Prisma, QuanProfile } from "@/generated/prisma/client";
import { quanDayKey, QUAN_CONTENT_VERSION } from "@/lib/tu-vi-quan-content";
import { QuanSessionError } from "@/lib/tu-vi-quan-session";

type Tx = Prisma.TransactionClient;
type Bag = Record<string, unknown>;
export type QuanPractice = "meditate" | "beads" | "chant" | "garden";
export type QuanPracticeState = { seconds: number; running: boolean; lastAt: number; lastTapAt: number; taps: number };
const modes: QuanPractice[] = ["meditate", "beads", "chant", "garden"];
const bag = (value: unknown) => (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as Bag;
const key = (profileId: string, kind: string, dayKey: string) => ({ profileId_kind_dayKey: { profileId, kind, dayKey } });
function fail(message: string, status = 409): never { throw new QuanSessionError(message, status); }

export async function readMonastery(tx: Tx, profileId: string, now: Date) {
  const day = quanDayKey(now);
  const [today, visits, tickets, resumable] = await Promise.all([
    tx.quanEntry.findMany({ where: { profileId, dayKey: day, kind: { in: [...modes.map(mode => "practice_" + mode), "meditate", "chant", "monastery_meditate", "monastery_chant", "monastery_garden", "voice_ticket_purchase"] } } }),
    tx.quanEntry.count({ where: { profileId, kind: "monastery_visit" } }),
    tx.quanEntry.findMany({ where: { profileId, kind: "voice_ticket", data: { path: ["used"], equals: false } }, orderBy: { createdAt: "asc" } }),
    tx.quanEncounter.findMany({ where: { profileId, freeDay: { startsWith: "ticket:" }, endsAt: { gt: now }, state: { in: ["left", "waiting", "invited", "active"] } }, select: { freeDay: true, endsAt: true } }),
  ]);
  const sum = (...kinds: string[]) => today.filter(row => kinds.includes(row.kind)).reduce((total, row) => total + row.points, 0);
  return {
    practices: Object.fromEntries(modes.map(mode => [mode, today.find(row => row.kind === "practice_" + mode)?.data ?? null])) as Record<QuanPractice, QuanPracticeState | null>,
    rewards: { meditate: sum("meditate", "monastery_meditate"), chant: sum("chant", "monastery_chant"), garden: sum("monastery_garden") },
    visits, lotusBloomed: visits >= 7, redeemedToday: today.some(row => row.kind === "voice_ticket_purchase"),
    tickets: [
      ...tickets.map(ticket => ({ id: ticket.id, minutes: 5, remainingSeconds: 300 })),
      ...resumable.filter(row => !tickets.some(ticket => "ticket:" + ticket.id === row.freeDay)).map(row => ({ id: row.freeDay!.slice(7), minutes: 5, remainingSeconds: Math.max(0, Math.ceil((row.endsAt!.getTime() - now.getTime()) / 1000)) })),
    ],
  };
}

export async function mutateMonastery(tx: Tx, profile: QuanProfile, body: Bag, now: Date) {
  const day = quanDayKey(now);
  const base = { profileId: profile.id, version: QUAN_CONTENT_VERSION, createdAt: now };
  if (body.action === "redeem_voice") {
    const existing = await tx.quanEntry.findUnique({ where: key(profile.id, "voice_ticket_purchase", day) });
    if (existing) return;
    const tickets = await tx.quanEntry.count({ where: { profileId: profile.id, kind: "voice_ticket", data: { path: ["used"], equals: false } } });
    if (tickets >= 2) fail("Bạn đang giữ hai vé. Hãy dùng một vé trước khi đổi thêm.");
    const balance = await tx.quanEntry.aggregate({ where: { profileId: profile.id }, _sum: { points: true } });
    if ((balance._sum.points ?? 0) < 60) fail("Cần 60 Điểm An Nhiên để đổi thêm 5 phút.");
    await tx.quanEntry.create({ data: { ...base, kind: "voice_ticket_purchase", dayKey: day, data: { title: "Đổi vé trò chuyện 5 phút" }, points: -60 } });
    await tx.quanEntry.create({ data: { ...base, kind: "voice_ticket", dayKey: randomUUID(), data: { used: false }, points: 0 } });
    return;
  }
  if (!modes.includes(body.mode as QuanPractice)) fail("Chọn hoạt động trong Tu viện.", 400);
  const mode = body.mode as QuanPractice;
  const where = key(profile.id, "practice_" + mode, day);
  const saved = await tx.quanEntry.findUnique({ where });
  const state: QuanPracticeState = { seconds: 0, running: false, lastAt: now.getTime(), lastTapAt: 0, taps: 0, ...bag(saved?.data) };
  const elapsed = Math.max(0, Math.floor((now.getTime() - state.lastAt) / 1000));
  if (body.action === "practice_start") {
    // One practice can earn time at once, including across tabs and devices.
    const others = await tx.quanEntry.findMany({ where: { profileId: profile.id, dayKey: day, kind: { startsWith: "practice_", not: "practice_" + mode } } });
    for (const row of others) {
      if (bag(row.data).running) await tx.quanEntry.update({ where: { id: row.id }, data: { data: { ...bag(row.data), running: false } as Prisma.InputJsonValue } });
    }
    state.running = true;
  } else if (["practice_tick", "practice_pause", "practice_finish"].includes(String(body.action))) {
    if (!saved) fail("Hãy bắt đầu hoạt động trước.");
    // A missing foreground heartbeat pauses credit instead of rewarding unattended time.
    if (state.running && elapsed <= 12) state.seconds = Math.min(180, state.seconds + elapsed);
    if (body.tap === true && state.running && now.getTime() - state.lastTapAt >= (mode === "garden" ? 12_000 : 4_000)) {
      state.taps = Math.min(mode === "garden" ? 4 : 27, state.taps + 1);
      state.lastTapAt = now.getTime();
    }
    if (body.action === "practice_pause") state.running = false;
    if (body.action === "practice_finish") {
      const duration = mode === "meditate" || mode === "garden" ? 60 : 120;
      if (state.seconds < duration || (mode === "beads" && state.taps < 27) || (mode === "garden" && state.taps < 4)) fail("Bạn chưa hoàn thành thời lượng và thao tác của lượt này.");
      const rewardKind = mode === "beads" || mode === "chant" ? "monastery_chant" : "monastery_" + mode;
      const legacyKind = mode === "meditate" ? "meditate" : mode === "garden" ? "" : "chant";
      const legacy = await tx.quanEntry.findUnique({ where: key(profile.id, legacyKind, day) });
      const earned = mode === "garden" ? 5 : mode === "meditate" && state.seconds < 180 ? 5 : 10;
      const points = Math.max(0, earned - (legacy?.points ?? 0));
      const previous = await tx.quanEntry.findUnique({ where: key(profile.id, rewardKind, day) });
      await tx.quanEntry.upsert({ where: key(profile.id, rewardKind, day),
        create: { ...base, kind: rewardKind, dayKey: day, data: { title: mode === "meditate" ? "Thiền trong Tu viện" : mode === "garden" ? "Chăm vườn sen" : "Tràng hạt và tụng niệm" }, points },
        update: { points: Math.max(previous?.points ?? 0, points) },
      });
      await tx.quanEntry.upsert({ where: key(profile.id, "monastery_visit", day), create: { ...base, kind: "monastery_visit", dayKey: day, data: {}, points: 0 }, update: {} });
      const days = await tx.quanEntry.count({ where: { profileId: profile.id, kind: "monastery_visit" } });
      if (days >= 7) await tx.quanItem.upsert({ where: { profileId_itemId: { profileId: profile.id, itemId: "journey-lantern-seven" } }, create: { profileId: profile.id, itemId: "journey-lantern-seven", acquiredAt: now }, update: {} });
      state.running = false;
    }
  } else fail("Hoạt động không hợp lệ.", 400);
  state.lastAt = now.getTime();
  await tx.quanEntry.upsert({ where, create: { ...base, kind: "practice_" + mode, dayKey: day, data: state, points: 0 }, update: { data: state } });
}
