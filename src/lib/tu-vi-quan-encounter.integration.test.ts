import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it, vi } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { generateWithLlmRouter } from "@/lib/llm-router";
import { answerEncounter, captureEncounterBirth, changeEncounter, finishEncounterSpeech, getEncounterSpeech, readEncounter } from "./tu-vi-quan-encounter";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/llm-router", () => ({
  hasExternalLlmProvider: () => true,
  generateWithLlmRouter: vi.fn(async () => ({ text: "Hãy bắt đầu bằng một việc nhỏ. Bạn muốn kể thêm điều gì?" })),
}));
// Voice and legacy PayOS fixtures both exercise the global table queue.
const url = process.env.QUAN_VOICE_TEST_DATABASE_URL;
if (url && !/^postgresql:\/\/[^/]+@127\.0\.0\.1:\d+\/quan_test(?:_\d+)?$/.test(url)) throw new Error("Use disposable quan_test");
const db = url ? new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }) : null;
const ids: string[] = [];
function player() {
  const id = randomUUID();
  ids.push(id);
  return { guest: { id, alias: "Khách thử" } };
}
const begin = (actor: ReturnType<typeof player>, kind = "tuvi", at = new Date()) =>
  changeEncounter(db!, actor, { action: "begin", kind }, at);
const act = async (actor: ReturnType<typeof player>, action: string, id: string, at?: Date) => {
  const row = await db!.quanEncounter.findUniqueOrThrow({ where: { id } });
  if (action === "start" && row.kind === "tuvi" && row.state === "invited" && (row.context as { chartMissing?: boolean }).chartMissing) {
    await changeEncounter(db!, actor, { action: "birth_confirm", id, input: { fullName: "Khách Thử Nghiệm", day: 15, month: 7, year: 1995, calendarType: "solar", birthHour: 19, gender: "male" } }, at);
  }
  return changeEncounter(db!, actor, { action, id }, at);
};
afterAll(async () => {
  if (!db) return;
  await db.quanOrder.deleteMany({ where: { ownerId: { in: ids } } });
  await db.quanProfile.deleteMany({ where: { identities: { some: { guestId: { in: ids } } } } });
  await db.$disconnect();
});

describe.skipIf(!db)("Tử Vi Quán voice seats in PostgreSQL", () => {
  it("gives one invitation, preserves the 300-second budget when switching hosts, and resets by Vietnam day", async () => {
    const a = player(), b = player();
    const now = new Date("2026-11-04T14:00:00Z");
    const [first, second] = await Promise.all([begin(a, "tuvi", now), begin(b, "tarot", now)]);
    expect([first.encounter!.state, second.encounter!.state].sort()).toEqual(["invited", "waiting"]);
    const [seated, waiting] = first.encounter!.state === "invited" ? [a, b] : [b, a];
    const seatedId = (seated === a ? first : second).encounter!.id;
    const waitingId = (waiting === a ? first : second).encounter!.id;
    const started = await act(seated, "start", seatedId, now);
    expect(started.encounter?.remainingSeconds).toBe(300);
    const oneMinute = new Date(now.getTime() + 60_000);
    await act(seated, "leave", seatedId, oneMinute);
    expect((await readEncounter(db!, waiting, oneMinute)).encounter?.state).toBe("invited");
    await act(waiting, "leave", waitingId, oneMinute);
    const resumed = await begin(seated, "iching", oneMinute);
    expect(resumed.encounter?.id).toBe(seatedId);
    expect(resumed.encounter?.context.lines).toHaveLength(6);
    expect((await act(seated, "start", seatedId, oneMinute)).encounter?.remainingSeconds).toBe(240);
    const exhausted = await begin(seated, "iching", new Date(now.getTime() + 300_001));
    expect(exhausted.freeRemainingSeconds).toBe(0);
    expect(exhausted.encounter?.state).toBe("ended");
    const next = await begin(seated, "tuvi", new Date("2026-11-04T17:00:00Z"));
    expect(next.freeRemainingSeconds).toBe(300);
    expect(next.encounter?.id).not.toBe(seatedId);
    await act(seated, "leave", next.encounter!.id, new Date("2026-11-04T17:00:01Z"));
  });

  it("limits audio to the owner, keeps a single speech reservation, and reuses a turn id", async () => {
    const a = player(), b = player();
    const id = (await begin(a, "tarot")).encounter!.id;
    await act(a, "start", id);
    const turnId = randomUUID();
    const question = "Tôi nên cân nhắc điều gì?";
    const first = await answerEncounter(db!, a, { id, turnId, question });
    expect(first.encounter?.messages.at(-1)).toMatchObject({ id: turnId, answer: expect.stringContaining("việc nhỏ") });
    expect((await answerEncounter(db!, a, { id, turnId, question })).encounter?.messages).toHaveLength(2);
    await expect(getEncounterSpeech(db!, b, id, turnId)).rejects.toMatchObject({ status: 404 });
    const audio = await getEncounterSpeech(db!, a, id, turnId);
    await expect(getEncounterSpeech(db!, a, id, turnId)).rejects.toMatchObject({ status: 409 });
    await finishEncounterSpeech(db!, a, id, { failed: false, aborted: true }, audio.speakingUntil);
    await changeEncounter(db!, a, { action: "interrupt", id, turnId });
    await expect(getEncounterSpeech(db!, a, id, turnId)).rejects.toMatchObject({ status: 404 });
    await act(a, "leave", id);
  });

  it("reserves a reward ticket across midnight, consumes it only on start and resumes without resetting time", async () => {
    const guest = player(), stranger = player();
    const now = new Date("2026-11-04T16:59:30Z");
    const daily = (await begin(guest, "tuvi", now)).encounter!.id;
    await act(guest, "leave", daily, now);
    const profile = await db!.quanIdentity.findUniqueOrThrow({ where: { guestId: guest.guest.id } });
    const ticket = await db!.quanEntry.create({ data: { profileId: profile.profileId, kind: "voice_ticket", dayKey: randomUUID(), points: 0, data: { used: false }, version: "test" } });
    await expect(changeEncounter(db!, stranger, { action: "begin", kind: "tuvi", ticketId: ticket.id }, now)).rejects.toMatchObject({ status: 404 });
    const reserved = await changeEncounter(db!, guest, { action: "begin", kind: "tuvi", ticketId: ticket.id }, now);
    const id = reserved.encounter!.id;
    await act(guest, "leave", id, now);
    expect((await db!.quanEntry.findUniqueOrThrow({ where: { id: ticket.id } })).data).toEqual({ used: false });
    await changeEncounter(db!, guest, { action: "begin", kind: "tuvi", ticketId: ticket.id }, now);
    const midnight = new Date("2026-11-04T17:00:01Z");
    expect((await act(guest, "start", id, midnight)).encounter?.remainingSeconds).toBe(300);
    const used = await db!.quanEntry.findUniqueOrThrow({ where: { id: ticket.id } });
    expect(used.data).toMatchObject({ used: true, encounterId: id });
    const later = new Date(midnight.getTime() + 60_000);
    await act(guest, "leave", id, later);
    expect((await readEncounter(db!, guest, later)).rewardTickets).toContainEqual({ id: ticket.id });
    const resumed = await changeEncounter(db!, guest, { action: "begin", kind: "tuvi", ticketId: ticket.id }, later);
    expect(resumed.encounter?.id).toBe(id);
    expect((await act(guest, "start", id, later)).encounter?.remainingSeconds).toBe(240);
    await act(guest, "leave", id, later);
    const nextDay = new Date(midnight.getTime() + 86_400_000);
    const saved = await changeEncounter(db!, guest, { action: "begin", kind: "iching", ticketId: ticket.id }, nextDay);
    expect(saved.encounter?.remainingSeconds).toBe(240);
    await act(guest, "start", id, nextDay);
    await act(guest, "leave", id, new Date(nextDay.getTime() + 241_000));
    await expect(changeEncounter(db!, guest, { action: "begin", kind: "tuvi", ticketId: ticket.id }, new Date(nextDay.getTime() + 242_000))).rejects.toMatchObject({ status: 409 });
  });

  it("asks for missing birth data, waits for voice confirmation and reads the chart opening", async () => {
    const guest = player(), stranger = player();
    const id = (await begin(guest)).encounter!.id;
    const capture = (transcript: string) => captureEncounterBirth(db!, guest, { id, transcript });
    await expect(changeEncounter(db!, guest, { action: "start", id })).rejects.toMatchObject({ status: 409 });
    try {
      await expect(captureEncounterBirth(db!, stranger, { id, transcript: "Nam" })).rejects.toMatchObject({ status: 404 });
      await expect(changeEncounter(db!, guest, { id, action: "birth_confirm", input: { year: 1995 } })).rejects.toMatchObject({ status: 400 });
      const reply = (fields: object) => vi.mocked(generateWithLlmRouter).mockResolvedValueOnce({ provider: "groq", model: "mock", text: JSON.stringify(fields) });
      reply({ day: 15, month: 7, year: 1995, birthHour: "19" });
      const partial = await capture("Sinh ngày mười lăm tháng bảy năm 1995");
      expect(partial.encounter?.context.birthDraft).toEqual({ day: 15, month: 7, year: 1995 });
      expect(partial.encounter?.messages.at(-1)?.answer).toContain("họ tên thật");
      reply({ fullName: "Nguyễn Văn An" });
      expect((await capture("Tôi tên Nguyễn Văn An")).encounter?.messages.at(-1)?.answer).toContain("âm lịch hay dương lịch");
      reply({ calendarType: "solar", birthHour: 19, birthMinute: 30 });
      expect((await capture("Dương lịch, bảy rưỡi tối")).encounter?.messages.at(-1)?.answer).toContain("lá số nam hay nữ");
      reply({ gender: "male" });
      const review = await capture("Nam");
      expect(review.encounter?.messages.at(-1)?.answer).toContain("19 giờ 30 phút");
      expect((await readEncounter(db!, guest)).encounter?.context.chartMissing).toBe(true);
      const done = await capture("Dạ, đúng rồi.");
      expect(done.encounter?.state).toBe("invited");
      expect(done.encounter?.endsAt).toBeUndefined();
      expect(done.freeRemainingSeconds).toBe(300);
      expect(done.encounter?.context.chartMissing).toBeUndefined();
      expect(done.encounter?.context.birthDraft).toBeUndefined();
      const overview = done.encounter?.messages.at(-1);
      expect(overview).toMatchObject({ id: "chart-opening", answer: expect.stringContaining("Con muốn Thầy nói thêm") });
      const speech = await getEncounterSpeech(db!, guest, id, "chart-opening");
      expect(speech.text).toEqual(overview?.answer);
      await finishEncounterSpeech(db!, guest, id, { failed: false, aborted: true }, speech.speakingUntil);
      await act(guest, "start", id);
      await answerEncounter(db!, guest, { id, turnId: randomUUID(), question: "Về công việc thì sao?" });
      expect(vi.mocked(generateWithLlmRouter).mock.lastCall?.[0].prompt).toContain("Quan Lộc");
    } finally { await act(guest, "leave", id); }
  });

  it("asks for a complete answer and avoids chaining follow-up questions", async () => {
    const a = player();
    const id = (await begin(a, "tarot")).encounter!.id;
    await act(a, "start", id);
    try {
      await answerEncounter(db!, a, { id, turnId: randomUUID(), question: "Xem giúp tôi về công việc." });
      expect(vi.mocked(generateWithLlmRouter).mock.lastCall?.[0].prompt).toContain("Mặc định kết thúc bằng một câu nhận định hoặc gợi ý.");
      await answerEncounter(db!, a, { id, turnId: randomUUID(), question: "Tôi đang cân nhắc đổi việc." });
      expect(vi.mocked(generateWithLlmRouter).mock.lastCall?.[0].prompt).toContain("Lượt trước thầy đã hỏi. Lượt này ưu tiên luận và không hỏi nối tiếp");
    } finally {
      await act(a, "leave", id);
    }
  });

  it("keeps the owned chart and prior discussion when free time becomes paid", async () => {
    const a = player(), stranger = player();
    const first = (await begin(a)).encounter!.id;
    await act(a, "start", first);
    await answerEncounter(db!, a, { id: first, turnId: randomUUID(), question: "Tôi đang làm nghề gốm, xin xem công việc." });
    await act(a, "leave", first);
    const order = await db!.quanOrder.create({ data: {
      ownerId: a.guest.id, alias: a.guest.alias, chart: {}, readingKind: "tuvi", amountVnd: 100000,
      minutes: 15, orderCode: BigInt(Date.now()), recoveryDigest: randomUUID(), expiresAt: new Date(), status: "PAID", paidAt: new Date(),
    } });
    const next = await changeEncounter(db!, a, { action: "begin", kind: "tuvi", orderId: order.id });
    expect(next.encounter?.context.chartMissing).toBeUndefined();
    expect(next.encounter?.messages.some(turn => turn.question.includes("nghề gốm"))).toBe(true);
    await act(a, "start", next.encounter!.id);
    await answerEncounter(db!, a, { id: next.encounter!.id, turnId: randomUUID(), question: "Thầy nhắc lại ý vừa nói giúp tôi." });
    const prompt = vi.mocked(generateWithLlmRouter).mock.lastCall![0].prompt;
    expect(prompt).toContain("nghề gốm");
    expect(prompt).toContain("Luôn xưng Thầy, gọi người xem là con");
    await expect(changeEncounter(db!, stranger, { action: "begin", kind: "tuvi", orderId: order.id })).rejects.toMatchObject({ status: 404 });
    await act(a, "leave", next.encounter!.id);
  });

  it("never starts an unpaid order and gives both paid durations only when starting the encounter", async () => {
    for (const minutes of [15, 30]) {
      const a = player();
      const order = await db!.quanOrder.create({ data: {
        ownerId: a.guest.id, alias: a.guest.alias, chart: {}, readingKind: "iching", amountVnd: minutes === 15 ? 100_000 : 200_000,
        minutes, orderCode: BigInt(Date.now() + minutes), recoveryDigest: randomUUID(), expiresAt: new Date(Date.now() + 60_000),
      } });
      const payload = { action: "begin", kind: "iching", orderId: order.id };
      await expect(changeEncounter(db!, a, payload)).rejects.toMatchObject({ status: 409 });
      await db!.quanOrder.update({ where: { id: order.id }, data: { status: "PAID", paidAt: new Date() } });
      const invited = await changeEncounter(db!, a, payload);
      expect(invited.encounter?.state).toBe("invited");
      expect(invited.encounter?.endsAt).toBeUndefined();
      const started = await act(a, "start", invited.encounter!.id);
      expect(started.encounter?.remainingSeconds).toBe(minutes * 60);
      await act(a, "leave", invited.encounter!.id);
    }
  });

  it("shares a paid balance across all three hosts, pauses on leave, and preserves each host's context", async () => {
    const owner = player(), stranger = player();
    const at = new Date("2026-11-05T08:00:00Z");
    await begin(owner, "tarot", at).then(view => act(owner, "leave", view.encounter!.id, at));
    const order = await db!.quanOrder.create({ data: {
      ownerId: owner.guest.id, alias: owner.guest.alias, chart: {}, readingKind: "tarot", amountVnd: 200_000, minutes: 30,
      orderCode: BigInt(Date.now()), recoveryDigest: randomUUID(), expiresAt: at, status: "PAID", paidAt: at,
    } });
    await expect(changeEncounter(db!, stranger, { action: "begin", kind: "iching", orderId: order.id }, at)).rejects.toMatchObject({ status: 404 });
    const first = await begin(owner, "tarot", at);
    expect(first.encounter?.orderId).toBe(order.id);
    const id = first.encounter!.id, cards = first.encounter!.context.cards;
    await act(owner, "start", id, at);
    const paused = await act(owner, "leave", id, new Date(at.getTime() + 60_123));
    expect(paused.encounter?.remainingSeconds).toBe(1740);
    const tomorrow = new Date(at.getTime() + 86_400_000);
    expect((await readEncounter(db!, owner, tomorrow)).paidRemainingSeconds).toBe(1740);
    const second = await begin(owner, "iching", tomorrow);
    expect(second.encounter).toMatchObject({ id, tier: "paid", remainingSeconds: 1740 });
    const staleLeave = await changeEncounter(db!, owner, { action: "leave", id, visitId: first.encounter!.visitId }, tomorrow);
    expect(staleLeave.encounter?.state).toBe("invited");
    await act(owner, "start", id, tomorrow);
    await act(owner, "leave", id, new Date(tomorrow.getTime() + 30_000));
    const third = await begin(owner, "tuvi", tomorrow);
    expect(third.encounter?.context.chartMissing).toBe(true);
    await act(owner, "start", id, tomorrow);
    await act(owner, "leave", id, tomorrow);
    const back = await begin(owner, "tarot", tomorrow);
    expect(back.encounter?.context.cards).toEqual(cards);
    expect(back.encounter?.remainingSeconds).toBe(1710);
    const row = await db!.quanOrder.findUniqueOrThrow({ where: { id: order.id } });
    expect(row.status).toBe("PAID");
    expect(row.remainingMs).toBe(1_709_877);
    await act(owner, "leave", id, tomorrow);
  });
});
