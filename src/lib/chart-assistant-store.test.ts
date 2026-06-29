import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ getDb: mocks.getDb }));

import {
  completeAssistantQuestion,
  getCompletedAssistantReading,
  getOwnedAssistantChart,
  listAssistantQuestions,
  reserveAssistantQuestionSlot,
} from "@/lib/chart-assistant-store";

const user = {
  id: "user-1",
  email: "reader@example.com",
  name: "Reader",
  role: "USER" as const,
  coinBalance: 0,
};

describe("chart assistant store", () => {
  beforeEach(() => {
    mocks.getDb.mockReset();
  });

  it("loads only a chart owned by a normal user", async () => {
    const findFirst = vi.fn(async () => ({ chart: { input: { fullName: "Reader" } } }));
    mocks.getDb.mockReturnValue({ chart: { findFirst } });

    const result = await getOwnedAssistantChart(user, "chart-1");

    expect(findFirst).toHaveBeenCalledWith({
      where: { id: "chart-1", userId: "user-1" },
      select: { chart: true },
    });
    expect(result).toMatchObject({ input: { fullName: "Reader" } });
  });

  it("requires a completed FULL/all reading for the same user and chart", async () => {
    const findFirst = vi.fn(async () => ({ id: "reading-1", content: "VIP report" }));
    mocks.getDb.mockReturnValue({ reading: { findFirst } });

    await expect(getCompletedAssistantReading("user-1", "chart-1")).resolves.toEqual({
      id: "reading-1",
      content: "VIP report",
    });
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        chartId: "chart-1",
        type: "FULL",
        scopeKey: "all",
        status: "COMPLETED",
      },
      select: { id: true, content: true },
    });
  });

  it("reserves the first free slot and retries a concurrent unique conflict", async () => {
    const findMany = vi.fn(async () => [{ slot: 1 }]);
    const create = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("unique"), { code: "P2002" }))
      .mockResolvedValueOnce({ id: "question-3", slot: 3, question: "Câu hỏi" });
    mocks.getDb.mockReturnValue({ assistantQuestion: { findMany, create } });

    const result = await reserveAssistantQuestionSlot("user-1", "chart-1", "reading-1", "Câu hỏi");

    expect(create).toHaveBeenNthCalledWith(1, {
      data: { userId: "user-1", chartId: "chart-1", readingId: "reading-1", slot: 2, question: "Câu hỏi" },
      select: { id: true, slot: true, question: true },
    });
    expect(create).toHaveBeenNthCalledWith(2, {
      data: { userId: "user-1", chartId: "chart-1", readingId: "reading-1", slot: 3, question: "Câu hỏi" },
      select: { id: true, slot: true, question: true },
    });
    expect(result?.slot).toBe(3);
  });

  it("returns persisted history and completes a reservation", async () => {
    const findMany = vi.fn(async () => [{ id: "q1", slot: 1, question: "Q", answer: "A", model: "deepseek/test" }]);
    const update = vi.fn(async () => ({ id: "q2", slot: 2, question: "Q2", answer: "A2", model: "groq/test" }));
    mocks.getDb.mockReturnValue({ assistantQuestion: { findMany, update } });

    await expect(listAssistantQuestions("user-1", "chart-1")).resolves.toHaveLength(1);
    await expect(
      completeAssistantQuestion({ id: "q2", slot: 2, question: "Q2" }, "A2", "groq/test"),
    ).resolves.toMatchObject({ answer: "A2", slot: 2 });
  });
});
