import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it, vi } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { generateWithLlmRouter } from "@/lib/llm-router";
import { answerEncounter, changeEncounter, finishEncounterSpeech, getEncounterSpeech, readEncounter } from "./tu-vi-quan-encounter";

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
const act = (actor: ReturnType<typeof player>, action: string, id: string, at?: Date) =>
  changeEncounter(db!, actor, { action, id }, at);
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
});
